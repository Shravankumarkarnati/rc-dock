import classNames from "classnames";
import * as React from "react";
import { usePortalManager } from "./DockPortalManager";
const DockTabPane = ({ cacheId, cached, prefixCls, forceRender, className, style, id, active, animated, destroyInactiveTabPane, tabKey, children, }) => {
    const { removeTabCache, updateTabCache } = usePortalManager();
    const ref = React.useRef(null);
    const setRef = React.useCallback((_ref) => {
        if (!_ref)
            return;
        const { div } = updateTabCache(id, children, _ref);
        if (!_ref.contains(div)) {
            _ref.append(div);
        }
        ref.current = _ref;
    }, [children, id, updateTabCache]);
    React.useEffect(() => {
        if (ref.current) {
            updateTabCache(id, children, ref.current);
        }
    }, [children, id, updateTabCache]);
    React.useEffect(() => {
        return () => {
            removeTabCache(id, ref.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
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
    return (React.createElement("div", { ref: cached ? setRef : null, id: cacheId, role: "tabpanel", "aria-labelledby": id && `${id}-tab-${tabKey}`, "aria-hidden": !active, style: Object.assign(Object.assign({}, mergedStyle), style), className: classNames(`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, className) }, (active || visited || forceRender) && renderChildren));
};
export default DockTabPane;
