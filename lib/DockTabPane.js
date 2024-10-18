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
exports.getStyles = void 0;
const React = __importStar(require("react"));
const DockPortalManager_1 = require("./DockPortalManager");
const DockTabPane = React.memo(function DockTabPaneBase(props) {
    const { active, cached, id, children } = props;
    const _children = useShouldRender(active, cached) ? children : null;
    return (React.createElement(DockPortalManager_1.DockCachedTabPortal, { id: id, content: children, cached: cached, role: "tabpanel", "aria-hidden": !active }, _children));
});
exports.default = DockTabPane;
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
exports.getStyles = getStyles;
// most complicated logic ever
const useShouldRender = (active, cached) => {
    const visited = React.useRef();
    if (active) {
        visited.current = true;
    }
    // when cached == undefined, it will still cache the children inside tabs component, but not across whole dock layout
    // when cached == false, children are destroyed when not active
    const isRender = cached === false ? active : visited.current;
    let renderChildren = false;
    if (cached) {
        renderChildren = false;
    }
    else if (isRender) {
        renderChildren = true;
    }
    if (active || visited.current) {
        return renderChildren;
    }
    return false;
};
