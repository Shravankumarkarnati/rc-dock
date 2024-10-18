import classNames from "classnames";
import * as React from "react";
import { DockCachedTabPortal } from "./DockPortalManager";
const DockTabPane = React.memo(function DockTabPaneBase(props) {
    const { active, animated, cached, cacheId, children, className, destroyInactiveTabPane, forceRender, id, prefixCls, style, tabKey, } = props;
    const _children = useShouldRender(active, forceRender, destroyInactiveTabPane, cached)
        ? children
        : null;
    return (React.createElement(DockCachedTabPortal, { id: cacheId, content: children, cached: cached, role: "tabpanel", "aria-labelledby": id && `${id}-tab-${tabKey}`, "aria-hidden": !active, style: getStyles(active, animated, style), className: getClassNames(active, prefixCls, className) }, _children));
});
export default DockTabPane;
const getClassNames = (active, prefixCls, className) => classNames(`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, className);
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
