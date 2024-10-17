import classNames from "classnames";
import { TabPaneProps } from "rc-tabs";
import * as React from "react";
import { DockCachedTabPortal } from "./DockPortalManager";

interface DockTabPaneProps extends TabPaneProps {
  cacheId?: string;
  cached: boolean;
}

const DockTabPane = React.memo(function DockTabPaneBase(
  props: DockTabPaneProps
) {
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
    <DockCachedTabPortal
      id={cacheId}
      content={children}
      cached={cached}
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
    </DockCachedTabPortal>
  );
});

export default DockTabPane;
