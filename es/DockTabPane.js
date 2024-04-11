import classNames from "classnames";
import * as React from "react";
import { usePortalManager } from "./DockPortalManager";
const DockTabPane = ({ cacheId, cached, prefixCls, forceRender, className, style, id, active, animated, destroyInactiveTabPane, tabKey, children, }) => {
    const { removeTabCache, getTabCache, updateTabCache } = usePortalManager();
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
    return (React.createElement("div", { ref: cached ? setRef : null, id: cacheId, role: "tabpanel", "aria-labelledby": id && `${id}-tab-${tabKey}`, "aria-hidden": !active, style: Object.assign(Object.assign({}, mergedStyle), style), className: classNames(`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, className) }, (active || visited || forceRender) && renderChildren));
};
export default DockTabPane;
