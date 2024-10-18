import * as React from "react";
import { DockCachedTabPortal } from "./DockPortalManager";
const DockTabPane = React.memo(function DockTabPaneBase(props) {
    const { active, cached, id, children } = props;
    const _children = useShouldRender(active, cached) ? children : null;
    return (React.createElement(DockCachedTabPortal, { id: id, content: children, cached: cached, role: "tabpanel", "aria-hidden": !active }, _children));
});
export default DockTabPane;
export const getStyles = (active, animated, style = {}) => {
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
