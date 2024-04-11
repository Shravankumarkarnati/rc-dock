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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classnames_1 = __importDefault(require("classnames"));
const React = __importStar(require("react"));
const DockPortalManager_1 = require("./DockPortalManager");
const DockTabPane = ({ cacheId, cached, prefixCls, forceRender, className, style, id, active, animated, destroyInactiveTabPane, tabKey, children, }) => {
    const { removeTabCache, getTabCache, updateTabCache } = (0, DockPortalManager_1.usePortalManager)();
    const [ref, setRef] = React.useState(null);
    const cache = React.useRef(null);
    React.useEffect(() => {
        if (cache.current) {
            if (!cached || cacheId !== cache.current.id) {
                removeTabCache(cache.current.id, ref);
                cache.current = null;
            }
        }
        if (cached && ref) {
            cache.current = getTabCache(cacheId, ref);
            if (!ref.contains(cache.current.div)) {
                ref.appendChild(cache.current.div);
            }
            updateTabCache(cache.current.id, children);
        }
        return () => {
            if (cache.current) {
                removeTabCache(cache.current.id, ref);
            }
        };
    }, [cached, children, cacheId, removeTabCache, getTabCache, updateTabCache, ref]);
    let visited = false;
    if (active) {
        visited = true;
    }
    else if (destroyInactiveTabPane) {
        visited = false;
    }
    const mergedStyle = {};
    if (!active) {
        if (animated) {
            mergedStyle.visibility = "hidden";
            mergedStyle.height = 0;
            mergedStyle.overflowY = "hidden";
        }
        else {
            mergedStyle.display = "none";
        }
    }
    // when cached == undefined, it will still cache the children inside tabs component, but not across whole dock layout
    // when cached == false, children are destroyed when not active
    const isRender = cached === false ? active : visited;
    let renderChildren = null;
    if (cached) {
        renderChildren = null;
    }
    else if (isRender || forceRender) {
        renderChildren = children;
    }
    return (React.createElement("div", { ref: cached ? setRef : null, id: cacheId, role: "tabpanel", "aria-labelledby": id && `${id}-tab-${tabKey}`, "aria-hidden": !active, style: Object.assign(Object.assign({}, mergedStyle), style), className: (0, classnames_1.default)(`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, className) }, (active || visited || forceRender) && renderChildren));
};
exports.default = DockTabPane;
