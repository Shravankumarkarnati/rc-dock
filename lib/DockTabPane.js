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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classnames_1 = __importDefault(require("classnames"));
const React = __importStar(require("react"));
const DockPortalManager_1 = require("./DockPortalManager");
const DockTabPane = React.memo(function DockTabPaneBase(props) {
    const { active, animated, cached, cacheId, children, className, destroyInactiveTabPane, forceRender, id, prefixCls, style, tabKey, } = props;
    const _children = useShouldRender(active, forceRender, destroyInactiveTabPane, cached)
        ? children
        : null;
    return (React.createElement(DockPortalManager_1.DockCachedTabPortal, { id: cacheId, content: children, cached: cached, role: "tabpanel", "aria-labelledby": id && `${id}-tab-${tabKey}`, "aria-hidden": !active, style: getStyles(active, animated, style), className: getClassNames(active, prefixCls, className) }, _children));
});
exports.default = DockTabPane;
const getClassNames = (active, prefixCls, className) => classnames_1.default(`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, className);
const getStyles = (active, animated, style = {}) => {
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
    return Object.assign(Object.assign({}, mergedStyle), style);
};
// most complicated logic ever
const useShouldRender = (active, forceRender, destroyInactiveTabPane, cached) => {
    const visited = React.useRef();
    if (active) {
        visited.current = true;
    }
    else if (destroyInactiveTabPane) {
        visited.current = false;
    }
    // when cached == undefined, it will still cache the children inside tabs component, but not across whole dock layout
    // when cached == false, children are destroyed when not active
    const isRender = cached === false ? active : visited.current;
    let renderChildren = false;
    if (cached) {
        renderChildren = false;
    }
    else if (isRender || forceRender) {
        renderChildren = true;
    }
    if (active || visited.current || forceRender) {
        return renderChildren;
    }
    return false;
};
