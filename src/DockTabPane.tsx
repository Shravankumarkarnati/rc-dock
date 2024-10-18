import classNames from "classnames";
import { TabPaneProps } from "rc-tabs";
import * as React from "react";
import { DockCachedTabPortal } from "./DockPortalManager";

interface DockTabPaneProps extends TabPaneProps {
  cacheId?: string;
  cached?: boolean;
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

  const _children = useShouldRender(
    active,
    forceRender,
    destroyInactiveTabPane,
    cached
  )
    ? children
    : null;

  return (
    <DockCachedTabPortal
      id={cacheId}
      content={children}
      cached={cached}
      role="tabpanel"
      aria-labelledby={id && `${id}-tab-${tabKey}`}
      aria-hidden={!active}
      style={getStyles(active, animated, style)}
      className={getClassNames(active, prefixCls, className)}
    >
      {_children}
    </DockCachedTabPortal>
  );
});

export default DockTabPane;

const getClassNames = (
  active: boolean,
  prefixCls?: string,
  className?: string
) =>
  classNames(
    `${prefixCls}-tabpane`,
    active && `${prefixCls}-tabpane-active`,
    className
  );

const getStyles = (
  active: boolean,
  animated: boolean,
  style: React.CSSProperties = {}
) => {
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

  return { ...mergedStyle, ...style };
};

// most complicated logic ever
const useShouldRender = (
  active: boolean,
  forceRender: boolean,
  destroyInactiveTabPane: boolean,
  cached?: boolean
) => {
  const visited = React.useRef<boolean | undefined>();

  if (active) {
    visited.current = true;
  } else if (destroyInactiveTabPane) {
    visited.current = false;
  }

  // when cached == undefined, it will still cache the children inside tabs component, but not across whole dock layout
  // when cached == false, children are destroyed when not active
  const isRender = cached === false ? active : visited.current;

  let renderChildren = false;
  if (cached) {
    renderChildren = false;
  } else if (isRender || forceRender) {
    renderChildren = true;
  }

  if (active || visited.current || forceRender) {
    return renderChildren;
  }

  return false;
};
