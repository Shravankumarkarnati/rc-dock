"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDockPortalManager = exports.DockPortalManager = void 0;
const UseForceUpdate_1 = require("./UseForceUpdate");
const react_dom_1 = require("react-dom");
const React = __importStar(require("react"));
const DockPortalManagerContext = React.createContext(null);
const DockPortalManager = ({ children, }) => {
    const _caches = React.useRef(new Map());
    const _pendingDestroy = React.useRef();
    const forceUpdate = UseForceUpdate_1.useForceUpdate();
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
            cache.portal = react_dom_1.createPortal(children, cache.div, cache.id);
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
exports.DockPortalManager = DockPortalManager;
const useDockPortalManager = () => React.useContext(DockPortalManagerContext);
exports.useDockPortalManager = useDockPortalManager;
