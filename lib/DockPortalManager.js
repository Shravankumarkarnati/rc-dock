"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.DockPortalManager = exports.usePortalManager = void 0;
const react_1 = __importStar(require("react"));
const react_dom_1 = require("react-dom");
const UseForceUpdate_1 = require("./UseForceUpdate");
/** @ignore */
const PortalManagerContextType = react_1.default.createContext(null);
const usePortalManager = () => react_1.default.useContext(PortalManagerContextType);
exports.usePortalManager = usePortalManager;
const DockPortalManager = ({ children }) => {
    const caches = (0, react_1.useRef)(new Map());
    const pendingDestroy = (0, react_1.useRef)();
    const forceUpdate = (0, UseForceUpdate_1.useForceUpdate)();
    const destroyRemovedPane = (0, react_1.useCallback)(() => {
        pendingDestroy.current = null;
        for (let [id, cache] of caches.current) {
            if (cache.owner == null) {
                caches.current.delete(id);
            }
        }
    }, []);
    const removeTabCache = (0, react_1.useCallback)((id, owner) => {
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
    const updateTabCache = (0, react_1.useCallback)((id, children, owner) => {
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
        cache = Object.assign(Object.assign({}, cache), { portal: (0, react_dom_1.createPortal)(children, cache.div, cache.id) });
        caches.current.set(id, cache);
        forceUpdate();
        return cache;
    }, [forceUpdate]);
    const value = (0, react_1.useMemo)(() => ({ removeTabCache, updateTabCache }), [removeTabCache, updateTabCache]);
    const portals = [...caches.current.values()]
        .map((cache) => cache.portal)
        .filter((i) => !!i);
    return (react_1.default.createElement(PortalManagerContextType.Provider, { value: value },
        children,
        react_1.default.createElement(react_1.default.Fragment, null, portals)));
};
exports.DockPortalManager = DockPortalManager;
