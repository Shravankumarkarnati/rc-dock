import classNames from "classnames";
import * as React from "react";
import { useDockPortalManager } from "./DockPortalManager";
const DockTabPane = React.memo(function DockTabPaneBase(props) {
    const context = useDockPortalManager();
    const [ref, setRefBase] = React.useState(null);
    const _cache = React.useRef(null);
    const { active, animated, cached, cacheId, children, className, destroyInactiveTabPane, forceRender, id, prefixCls, style, tabKey, } = props;
    const setRef = React.useCallback((_ref) => {
        // updateCache - componentDidMount
        if (_ref) {
            _cache.current = context.getTabCache(cacheId, _ref);
            if (!_ref.contains(_cache.current.div)) {
                _ref.appendChild(_cache.current.div);
            }
            context.updateTabCache(_cache.current.id, children);
        }
        setRefBase(_ref);
    }, [context.getTabCache, context.updateTabCache, children, cacheId]);
    React.useEffect(() => {
        // updateCache - componentDidUpdate
        if (!ref)
            return;
        if (_cache.current) {
            if (!cached || cacheId !== _cache.current.id) {
                context.removeTabCache(_cache.current.id, ref);
                _cache.current = null;
            }
            if (cached) {
                context.updateTabCache(_cache.current.id, children);
            }
        }
    }, [
        cached,
        children,
        cacheId,
        context.updateTabCache,
        context.removeTabCache,
        context.getTabCache,
    ]);
    React.useEffect(() => {
        // componentWillUnmount
        return () => {
            if (ref && _cache.current.id)
                context.removeTabCache(_cache.current.id, ref);
        };
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
    let getRef = cached ? setRef : null;
    return (React.createElement("div", { ref: getRef, id: cacheId, role: "tabpanel", "aria-labelledby": id && `${id}-tab-${tabKey}`, "aria-hidden": !active, style: Object.assign(Object.assign({}, mergedStyle), style), className: classNames(`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, className) }, (active || visited || forceRender) && renderChildren));
});
export default DockTabPane;
