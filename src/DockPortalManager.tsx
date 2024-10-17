import { TabPaneCache } from "./DockData";
import { useForceUpdate } from "./UseForceUpdate";
import { createPortal } from "react-dom";
import * as React from "react";

type Context = {
  updateTabCache(
    id: string,
    children: React.ReactNode,
    owner: any
  ): TabPaneCache;
  removeTabCache(id: string, owner: any): void;
};

const DockPortalManagerContext = React.createContext<Context>(null!);

export const DockPortalManager = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const _caches = React.useRef(new Map<string, TabPaneCache>());
  const _pendingDestroy = React.useRef<any>();

  const forceUpdate = useForceUpdate();

  const destroyRemovedPane = React.useCallback(() => {
    _pendingDestroy.current = null;
    let cacheRemoved = false;
    for (let [id, cache] of _caches.current) {
      if (cache.owner == null) {
        _caches.current.delete(id);
        cacheRemoved = true;
      }
    }
    if (cacheRemoved) {
      forceUpdate();
    }
  }, [forceUpdate]);

  const removeTabCache: Context["removeTabCache"] = React.useCallback(
    (id, owner) => {
      let cache = _caches.current.get(id);
      if (cache && cache.owner === owner) {
        cache.owner = null;
        if (!_pendingDestroy.current) {
          // it could be reused by another component, so let's wait
          _pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
        }
      }
    },
    [destroyRemovedPane]
  );

  const updateTabCache: Context["updateTabCache"] = React.useCallback(
    (id, children, owner) => {
      let cache = _caches.current.get(id);

      if (!cache) {
        let div = document.createElement("div");
        div.className = "dock-pane-cache";
        cache = { div, id, owner };
      } else {
        cache.owner = owner;
      }

      cache.portal = createPortal(children, cache.div, cache.id);
      _caches.current.set(id, cache);

      forceUpdate();

      return cache;
    },
    [forceUpdate]
  );

  const value: Context = React.useMemo(
    () => ({ updateTabCache, removeTabCache }),
    [updateTabCache, removeTabCache]
  );

  let portals: React.ReactPortal[] = [..._caches.current.values()]
    .map((cache) => cache.portal)
    .filter((i) => !!i);

  return (
    <DockPortalManagerContext.Provider value={value}>
      {children}
      {portals}
    </DockPortalManagerContext.Provider>
  );
};

type Props = {
  id: string;
  cached: boolean;
  content: React.ReactNode;
} & Omit<JSX.IntrinsicElements["div"], "id" | "ref">;

export const DockCachedTabPortal = React.memo(function _DockCachedTabPortal({
  id,
  cached,
  content,
  children,
  ...props
}: Props) {
  const { removeTabCache, updateTabCache } = React.useContext(
    DockPortalManagerContext
  );

  const [ref, setRefBase] = React.useState<null | HTMLElement>(null);

  const _cache = React.useRef<null | TabPaneCache>(null);

  const setRef = React.useCallback(
    (_ref: HTMLElement | null) => {
      if (_ref) {
        _cache.current = updateTabCache(id, content, _ref);
        if (!_ref.contains(_cache.current.div)) {
          _ref.appendChild(_cache.current.div);
        }
      }
      setRefBase(_ref);
    },
    [updateTabCache, id, content]
  );

  React.useEffect(() => {
    if (!ref) return;

    if (_cache.current) {
      if (!cached || id !== _cache.current.id) {
        removeTabCache(_cache.current.id, ref);
        _cache.current = null;
      }

      if (cached) {
        updateTabCache(_cache.current.id, content, ref);
      }
    }
  }, [cached, content, id, ref, removeTabCache, updateTabCache]);

  React.useEffect(() => {
    return () => {
      if (ref && _cache.current.id) removeTabCache(_cache.current.id, ref);
    };
  }, []);

  return (
    <div {...props} ref={cached ? setRef : null} id={id}>
      {children}
    </div>
  );
});
