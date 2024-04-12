import React, { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
/** @ignore */
const PortalManagerContextType = React.createContext(null);
export const usePortalManager = () => React.useContext(PortalManagerContextType);
export const DockPortalManager = ({ children }) => {
    const [caches, setCaches] = useState(new Map());
    const pendingDestroy = useRef();
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
    const getTabCache = useCallback((id, owner) => {
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
        }
        else {
            cache.owner = owner;
        }
        return cache;
    }, [caches]);
    const removeTabCache = useCallback((id, owner) => {
        let cache = caches.get(id);
        if (cache && cache.owner === owner) {
            cache.owner = null;
            if (!pendingDestroy.current) {
                // it could be reused by another component, so let's wait
                pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
            }
        }
    }, [caches, destroyRemovedPane]);
    const updateTabCache = useCallback((id, children) => {
        setCaches((prev) => {
            const next = new Map(prev);
            let cache = next.get(id);
            if (cache) {
                cache.portal = createPortal(children, cache.div, cache.id);
            }
            return next;
        });
    }, []);
    const value = useMemo(() => ({ caches, getTabCache, removeTabCache, updateTabCache }), [caches, getTabCache, removeTabCache, updateTabCache]);
    return (React.createElement(PortalManagerContextType.Provider, { value: value }, children));
};
export const RenderDockPortals = () => {
    const { caches } = usePortalManager();
    let portals = [];
    for (let [, cache] of caches) {
        if (cache.portal) {
            portals.push(cache.portal);
        }
    }
    return React.createElement(React.Fragment, null, portals);
};
