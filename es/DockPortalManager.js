import React, { useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useForceUpdate } from "./UseForceUpdate";
/** @ignore */
const PortalManagerContextType = React.createContext(null);
export const usePortalManager = () => React.useContext(PortalManagerContextType);
export const DockPortalManager = ({ children }) => {
    const caches = useRef(new Map());
    const pendingDestroy = useRef();
    const forceUpdate = useForceUpdate();
    const destroyRemovedPane = useCallback(() => {
        pendingDestroy.current = null;
        for (let [id, cache] of caches.current) {
            if (cache.owner == null) {
                caches.current.delete(id);
            }
        }
    }, []);
    const removeTabCache = useCallback((id, owner) => {
        let cache = caches.current.get(id);
        if (cache && cache.owner === owner) {
            cache.owner = null;
            if (!pendingDestroy.current) {
                // it could be reused by another component, so let's wait
                pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
            }
            forceUpdate();
        }
    }, [destroyRemovedPane, forceUpdate]);
    const updateTabCache = useCallback((id, children, owner) => {
        var _a;
        let cache = caches.current.get(id);
        if (!cache) {
            let div = document.createElement("div");
            div.className = "dock-pane-cache";
            cache = { div, id, owner };
        }
        if (((_a = cache.portal) === null || _a === void 0 ? void 0 : _a.children) === children) {
            return cache;
        }
        cache = Object.assign(Object.assign({}, cache), { portal: createPortal(children, cache.div, cache.id) });
        caches.current.set(id, cache);
        forceUpdate();
        return cache;
    }, [forceUpdate]);
    const value = useMemo(() => ({ removeTabCache, updateTabCache }), [removeTabCache, updateTabCache]);
    const portals = [...caches.current.values()]
        .map((cache) => cache.portal)
        .filter((i) => !!i);
    return (React.createElement(PortalManagerContextType.Provider, { value: value },
        children,
        React.createElement(React.Fragment, null, portals)));
};
