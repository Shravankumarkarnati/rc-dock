import React, { useCallback, useMemo, useRef, useState } from "react";
import { TabPaneCache } from "./DockData";
import { createPortal } from "react-dom";

type PortalManager = {
  getTabCache(id: string, owner: any): TabPaneCache;
  removeTabCache(id: string, owner: any): void;
  updateTabCache(id: string, children: React.ReactNode): void;
};

/** @ignore */
const PortalManagerContextType = React.createContext<PortalManager>(null!);

export const usePortalManager = React.useContext(PortalManagerContextType);

type Props = {
  children: React.ReactNode;
};

export const DockPortalManager = ({ children }: Props) => {
  const [caches, setCaches] = useState(new Map<string, TabPaneCache>());
  const pendingDestroy = useRef<NodeJS.Timeout | null>();

  const destroyRemovedPane = useCallback(() => {
    pendingDestroy.current = null;
    setCaches((prev) => {
      const next = new Map(prev);
      for (let [id, cache] of next) {
        if (cache.owner == null) {
          next.delete(id);
        }
      }
      return prev;
    });
  }, []);

  const getTabCache = useCallback(
    (id: string, owner: any): TabPaneCache => {
      let cache = caches.get(id);

      if (!cache) {
        let div = document.createElement("div");
        div.className = "dock-pane-cache";
        cache = { div, id, owner };
        setCaches((prev) => {
          const next = new Map(prev);
          next.set(id, cache);
          return next;
        });
      } else {
        cache.owner = owner;
      }

      return cache;
    },
    [caches]
  );

  const removeTabCache = useCallback(
    (id: string, owner: any): void => {
      let cache = caches.get(id);
      if (cache && cache.owner === owner) {
        cache.owner = null;
        if (!pendingDestroy.current) {
          // it could be reused by another component, so let's wait
          pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
        }
      }
    },
    [caches]
  );

  const updateTabCache = useCallback(
    (id: string, children: React.ReactNode): void => {
      setCaches((prev) => {
        const next = new Map(prev);
        let cache = next.get(id);
        if (cache) {
          cache.portal = createPortal(children, cache.div, cache.id);
        }
        return next;
      });
    },
    []
  );

  const value: PortalManager = useMemo(
    () => ({ getTabCache, removeTabCache, updateTabCache }),
    [getTabCache, removeTabCache, updateTabCache]
  );

  return (
    <PortalManagerContextType.Provider value={value}>
      {children}
    </PortalManagerContextType.Provider>
  );
};
