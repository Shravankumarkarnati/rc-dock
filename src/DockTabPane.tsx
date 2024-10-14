import classNames from "classnames"
import { TabsProps } from "rc-tabs"
import * as React from "react"
import { usePortalManager } from "./DockPortalManager"

export type Tab = NonNullable<TabsProps["items"][0]>

interface DockTabPaneProps extends Omit<Tab, "label"> {
  cacheId?: string
  cached: boolean
}

const DockTabPane = ({
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
}: DockTabPaneProps) => {
  const { removeTabCache, updateTabCache } = usePortalManager()
  const ref = React.useRef<HTMLElement | null>(null)

  const setRef = React.useCallback(
    (_ref: HTMLElement | null) => {
      if (!_ref) return

      const { div } = updateTabCache(id, children, _ref)

      if (!_ref.contains(div)) {
        _ref.append(div)
      }

      ref.current = _ref
    },
    [children, id, updateTabCache],
  )

  React.useEffect(() => {
    if (ref.current) {
      console.log("update", id)
      updateTabCache(id, children, ref.current)
    }
  }, [children, id, updateTabCache])

  React.useEffect(() => {
    return () => {
      console.log("remove")
      removeTabCache(id, ref.current)
    }
  }, [])

  let visited = false
  if (active) {
    visited = true
  } else if (destroyInactiveTabPane) {
    visited = false
  }

  const mergedStyle: React.CSSProperties = {}
  if (!active) {
    if (animated) {
      mergedStyle.visibility = "hidden"
      mergedStyle.height = 0
      mergedStyle.overflowY = "hidden"
    } else {
      mergedStyle.display = "none"
    }
  }

  // when cached == undefined, it will still cache the children inside tabs component, but not across whole dock layout
  // when cached == false, children are destroyed when not active
  const isRender = cached === false ? active : visited

  let renderChildren: React.ReactNode = null
  if (cached) {
    renderChildren = null
  } else if (isRender || forceRender) {
    renderChildren = children
  }

  return (
    <div
      ref={cached ? setRef : null}
      id={cacheId}
      role="tabpanel"
      aria-labelledby={id && `${id}-tab-${tabKey}`}
      aria-hidden={!active}
      style={{ ...mergedStyle, ...style }}
      className={classNames(
        `${prefixCls}-tabpane`,
        active && `${prefixCls}-tabpane-active`,
        className,
      )}
    >
      {(active || visited || forceRender) && renderChildren}
    </div>
  )
}

export default DockTabPane
