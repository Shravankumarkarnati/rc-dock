import classNames from "classnames";
import { TabPaneProps } from "rc-tabs";
import * as React from "react";
import { TabPaneCache, useDockContext } from "./DockData";

interface DockTabPaneProps extends TabPaneProps {
  cacheId?: string;
  cached: boolean;
}

const DockTabPane = React.memo(function DockTabPaneBase(
  props: DockTabPaneProps
) {
  const context = useDockContext();

  const [ref, setRefBase] = React.useState<null | HTMLElement>(null);

  const _cache = React.useRef<null | TabPaneCache>(null);

  const {
    active,
    animated,
    cached,
    cacheId,
    children,
    className,
    destroyInactiveTabPane,
    forceRender,
    id,
    prefixCls,
    style,
    tabKey,
  } = props;

  const setRef = React.useCallback(
    (_ref: HTMLElement | null) => {
      // updateCache - componentDidMount
      if (_ref) {
        _cache.current = context.getTabCache(cacheId, _ref);
        if (!_ref.contains(_cache.current.div)) {
          _ref.appendChild(_cache.current.div);
        }
        context.updateTabCache(_cache.current.id, children);
      }
      setRefBase(_ref);
    },
    [context.getTabCache, context.updateTabCache, children, cacheId]
  );

  React.useEffect(() => {
    // updateCache - componentDidUpdate
    if (!ref) return;

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
  } else if (destroyInactiveTabPane) {
    visited = false;
  }

  const mergedStyle: React.CSSProperties = {};
  if (!active) {
    if (animated) {
      mergedStyle.visibility = "hidden";
      mergedStyle.height = 0;
      mergedStyle.overflowY = "hidden";
    } else {
      mergedStyle.display = "none";
    }
  }
  // when cached == undefined, it will still cache the children inside tabs component, but not across whole dock layout
  // when cached == false, children are destroyed when not active
  const isRender = cached === false ? active : visited;
  let renderChildren: React.ReactNode = null;
  if (cached) {
    renderChildren = null;
  } else if (isRender || forceRender) {
    renderChildren = children;
  }

  let getRef = cached ? setRef : null;

  return (
    <div
      ref={getRef}
      id={cacheId}
      role="tabpanel"
      aria-labelledby={id && `${id}-tab-${tabKey}`}
      aria-hidden={!active}
      style={{ ...mergedStyle, ...style }}
      className={classNames(
        `${prefixCls}-tabpane`,
        active && `${prefixCls}-tabpane-active`,
        className
      )}
    >
      {(active || visited || forceRender) && renderChildren}
    </div>
  );
});

export default DockTabPane;
