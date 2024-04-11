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
exports.RenderDockPortals = exports.DockPortalManager = exports.usePortalManager = void 0;
const react_1 = __importStar(require("react"));
const react_dom_1 = require("react-dom");
/** @ignore */
const PortalManagerContextType = react_1.default.createContext(null);
const usePortalManager = () => react_1.default.useContext(PortalManagerContextType);
exports.usePortalManager = usePortalManager;
const DockPortalManager = ({ children }) => {
    const [caches, setCaches] = (0, react_1.useState)(new Map());
    const pendingDestroy = (0, react_1.useRef)();
    const destroyRemovedPane = (0, react_1.useCallback)(() => {
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
    const getTabCache = (0, react_1.useCallback)((id, owner) => {
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
    const removeTabCache = (0, react_1.useCallback)((id, owner) => {
        let cache = caches.get(id);
        if (cache && cache.owner === owner) {
            cache.owner = null;
            if (!pendingDestroy.current) {
                // it could be reused by another component, so let's wait
                pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
            }
        }
    }, [caches, destroyRemovedPane]);
    const updateTabCache = (0, react_1.useCallback)((id, children) => {
        setCaches((prev) => {
            const next = new Map(prev);
            let cache = next.get(id);
            if (cache) {
                cache.portal = (0, react_dom_1.createPortal)(children, cache.div, cache.id);
            }
            return next;
        });
    }, []);
    const value = (0, react_1.useMemo)(() => ({ caches, getTabCache, removeTabCache, updateTabCache }), [caches, getTabCache, removeTabCache, updateTabCache]);
    return (react_1.default.createElement(PortalManagerContextType.Provider, { value: value }, children));
};
exports.DockPortalManager = DockPortalManager;
const RenderDockPortals = () => {
    const { caches } = (0, exports.usePortalManager)();
    let portals = [];
    for (let [, cache] of caches) {
        if (cache.portal) {
            portals.push(cache.portal);
        }
    }
    return react_1.default.createElement(react_1.default.Fragment, null, "portals");
};
exports.RenderDockPortals = RenderDockPortals;
