import * as React from "react";
import classNames from "classnames";
import { DockContext, TabPaneCache } from "./DockData";
import { TabPaneProps } from "rc-tabs";
import { useDockContext } from "./DockContext";

interface DockTabPaneProps extends TabPaneProps {
  cacheId?: string;
  cached: boolean;
}

const DockTabPane: React.FC<DockTabPaneProps> = React.memo(
  ({
    cacheId,
    cached,
    prefixCls,
    forceRender,
    className,
    style,
    id,
    active,
    animated,
    destroyInactiveTabPane,
    tabKey,
    children,
  }) => {
    const { removeTabCache, updateTabCache, getTabCache } = useDockContext();
    const _ref = React.useRef<null | HTMLDivElement>(null);
    const _cache = React.useRef<null | TabPaneCache>(null);

    const getRef = React.useCallback((r: HTMLDivElement) => {
      _ref.current = r;
    }, []);

    const updateCache = React.useCallback(() => {
      if (_cache.current) {
        if (!cached || cacheId !== _cache.current.id) {
          removeTabCache(_cache.current.id, this);
          _cache.current = null;
        }
      }
      if (cached && _ref) {
        _cache.current = getTabCache(cacheId, this);
        if (!_ref.current.contains(_cache.current.div)) {
          _ref.current.appendChild(_cache.current.div);
        }
        updateTabCache(_cache.current.id, children);
      }
    }, [removeTabCache, updateTabCache, getTabCache]);

    React.useEffect(() => {
      updateCache();

      return () => {
        if (_cache.current) {
          removeTabCache(_cache.current.id, this);
        }
      };
    }, [updateCache, removeTabCache]);

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

    return (
      <div
        ref={cached ? getRef : null}
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
  }
);

export default DockTabPane;
