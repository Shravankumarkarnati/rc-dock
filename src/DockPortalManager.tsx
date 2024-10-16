import { TabPaneCache } from "./DockData";
import { useForceUpdate } from "./UseForceUpdate";
import { createPortal } from "react-dom";
import * as React from "react";

type Context = {
  getTabCache(id: string, owner: any): TabPaneCache;
  removeTabCache(id: string, owner: any): void;
  updateTabCache(id: string, children: React.ReactNode): void;
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

  const getTabCache: Context["getTabCache"] = React.useCallback((id, owner) => {
    let cache = _caches.current.get(id);
    if (!cache) {
      let div = document.createElement("div");
      div.className = "dock-pane-cache";
      cache = { div, id, owner };
      _caches.current.set(id, cache);
    } else {
      cache.owner = owner;
    }

    return cache;
  }, []);

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
    (id, children): void => {
      let cache = _caches.current.get(id);
      if (cache) {
        cache.portal = createPortal(children, cache.div, cache.id);
        forceUpdate();
      }
    },
    [forceUpdate]
  );

  const value: Context = React.useMemo(
    () => ({ updateTabCache, getTabCache, removeTabCache }),
    [updateTabCache, getTabCache, removeTabCache]
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

export const useDockPortalManager = () =>
  React.useContext(DockPortalManagerContext);
