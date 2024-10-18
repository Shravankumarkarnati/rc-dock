var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useForceUpdate } from "./UseForceUpdate";
import { createPortal } from "react-dom";
import * as React from "react";
const DockPortalManagerContext = React.createContext(null);
export const DockPortalManager = ({ children }) => {
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
    const updateTabCache = React.useCallback((id, children, owner) => {
        let cache = _caches.current.get(id);
        if (!cache) {
            let div = document.createElement("div");
            div.className = "dock-pane-cache";
            cache = { div, id, owner };
        }
        else {
            cache.owner = owner;
        }
        cache.portal = createPortal(children, cache.div, cache.id);
        _caches.current.set(id, cache);
        forceUpdate();
        return cache;
    }, [forceUpdate]);
    const value = React.useMemo(() => ({ updateTabCache, removeTabCache }), [updateTabCache, removeTabCache]);
    let portals = [..._caches.current.values()]
        .map((cache) => cache.portal)
        .filter((i) => !!i);
    return (React.createElement(DockPortalManagerContext.Provider, { value: value },
        children,
        portals));
};
export const DockCachedTabPortal = React.memo(function _DockCachedTabPortal(_a) {
    var { id, cached, content, children } = _a, props = __rest(_a, ["id", "cached", "content", "children"]);
    const { removeTabCache, updateTabCache } = React.useContext(DockPortalManagerContext);
    const [ref, setRefBase] = React.useState(null);
    const _cache = React.useRef(null);
    const setRef = React.useCallback((_ref) => {
        if (_ref) {
            _cache.current = updateTabCache(id, content, _ref);
            if (!_ref.contains(_cache.current.div)) {
                _ref.appendChild(_cache.current.div);
            }
        }
        setRefBase(_ref);
    }, [updateTabCache, id, content]);
    React.useEffect(() => {
        if (!ref)
            return;
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
            if (ref && _cache.current.id) {
                removeTabCache(_cache.current.id, ref);
            }
        };
    }, []);
    return (React.createElement("div", Object.assign({}, props, { ref: cached ? setRef : null, id: id }), children));
});
