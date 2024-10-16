import { useForceUpdate } from "./UseForceUpdate";
import { createPortal } from "react-dom";
import * as React from "react";
const DockPortalManagerContext = React.createContext(null);
export const DockPortalManager = ({ children, }) => {
    const _caches = React.useRef(new Map());
    const _pendingDestroy = React.useRef();
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
    const getTabCache = React.useCallback((id, owner) => {
        let cache = _caches.current.get(id);
        if (!cache) {
            let div = document.createElement("div");
            div.className = "dock-pane-cache";
            cache = { div, id, owner };
            _caches.current.set(id, cache);
        }
        else {
            cache.owner = owner;
        }
        return cache;
    }, []);
    const removeTabCache = React.useCallback((id, owner) => {
        let cache = _caches.current.get(id);
        if (cache && cache.owner === owner) {
            cache.owner = null;
            if (!_pendingDestroy.current) {
                // it could be reused by another component, so let's wait
                _pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
            }
        }
    }, [destroyRemovedPane]);
    const updateTabCache = React.useCallback((id, children) => {
        let cache = _caches.current.get(id);
        if (cache) {
            cache.portal = createPortal(children, cache.div, cache.id);
            forceUpdate();
        }
    }, [forceUpdate]);
    const value = React.useMemo(() => ({ updateTabCache, getTabCache, removeTabCache }), [updateTabCache, getTabCache, removeTabCache]);
    let portals = [..._caches.current.values()]
        .map((cache) => cache.portal)
        .filter((i) => !!i);
    return (React.createElement(DockPortalManagerContext.Provider, { value: value },
        children,
        portals));
};
export const useDockPortalManager = () => React.useContext(DockPortalManagerContext);
