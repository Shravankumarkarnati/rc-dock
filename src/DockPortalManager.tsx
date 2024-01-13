import {TabPaneCache} from "LayoutData";
import {ReactNode, useCallback, useEffect, useMemo, useRef} from "react";
import {createPortal} from "react-dom";
import {useDockContext} from "./DockContext";

export const useDockPortalManager = () => {
  const caches = useRef(new Map<string, TabPaneCache>());
  const pendingDestroy = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);
  const {updateVersion} = useDockContext()

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const destroyRemovedPane = useCallback(() => {
    pendingDestroy.current = null;
    let cacheRemoved = false;

    for (let [id, cache] of caches.current) {
      if (cache.owner == null) {
        caches.current.delete(id);
        cacheRemoved = true;
      }
    }

    if (cacheRemoved && isMounted.current) {
      updateVersion()
    }
  }, []);

  const getTabCache = useCallback((id: string, owner: any): TabPaneCache => {
    let cache = caches.current.get(id);

    if (!cache) {
      let div = document.createElement("div");
      div.className = "dock-pane-cache";
      cache = {div, id, owner};
      caches.current.set(id, cache);
    } else {
      cache.owner = owner;
    }

    return cache;
  }, []);

  const removeTabCache = useCallback((id: string, owner: any) => {
    let cache = caches.current.get(id);
    if (cache && cache.owner === owner) {
      cache.owner = null;
      if (!pendingDestroy.current) {
        // it could be reused by another component, so let's wait
        pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
      }
    }
  }, []);

  const updateTabCache = useCallback((id: string, children: ReactNode) => {
    let cache = caches.current.get(id);
    if (cache) {
      cache.portal = createPortal(children as ReactNode, cache.div, cache.id);
      updateVersion()
    }
  }, []);

  return useMemo(
    () => ({
      destroyRemovedPane,
      getTabCache,
      removeTabCache,
      updateTabCache,
    }),
    []
  );
};
