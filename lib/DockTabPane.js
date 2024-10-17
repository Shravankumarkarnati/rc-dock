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
    return (React.createElement(DockPortalManager_1.DockCachedTabPortal, { id: cacheId, content: children, cached: cached, role: "tabpanel", "aria-labelledby": id && `${id}-tab-${tabKey}`, "aria-hidden": !active, style: Object.assign(Object.assign({}, mergedStyle), style), className: classnames_1.default(`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, className) }, (active || visited || forceRender) && renderChildren));
});
exports.default = DockTabPane;
