import classNames from "classnames"
import Dropdown from "rc-dropdown"
import Menu, { MenuItem } from "rc-menu"
import Tabs from "rc-tabs"
import * as React from "react"
import { getFloatPanelSize } from "./Algorithm"
import { DropDirection, PanelData, TabData, useDockContext } from "./DockData"
import { DockTabBar } from "./DockTabBar"
import DockTabPane, { Tab } from "./DockTabPane"
import { groupClassNames } from "./Utils"
import { isWindowBoxEnabled } from "./WindowBox"
import { DragDropDiv } from "./dragdrop/DragDropDiv"
import * as DragManager from "./dragdrop/DragManager"

function findParentPanel(element: HTMLElement) {
  for (let i = 0; i < 10; ++i) {
    if (!element) {
      return null
    }
    if (element.classList.contains("dock-panel")) {
      return element
    }
    element = element.parentElement
  }
  return null
}

function isPopupDiv(r: HTMLDivElement): boolean {
  return (
    r == null ||
    r.parentElement?.tagName === "LI" ||
    r.parentElement?.parentElement?.tagName === "LI"
  )
}

const TabLabel = ({ data }: { data: TabData }) => {
  const ref = React.useRef<null | HTMLDivElement>(null)
  const setRef = React.useCallback((r: HTMLDivElement) => {
    ref.current = isPopupDiv(r) ? null : r
  }, [])

  const hitAreaRef = React.useRef<null | HTMLDivElement>(null)
  const setHitAreaRef = React.useCallback((r: HTMLDivElement) => {
    hitAreaRef.current = isPopupDiv(r) ? null : r
  }, [])

  const { dockMove, getGroup, getDockId, setDropRect } = useDockContext()

  const getDropDirection = React.useCallback((e: DragManager.DragState): DropDirection => {
    let rect = hitAreaRef.current?.getBoundingClientRect()
    let midx = rect.left + rect.width * 0.5
    return e.clientX > midx ? "after-tab" : "before-tab"
  }, [])

  const onCloseClick = React.useCallback(
    (e: React.MouseEvent) => {
      dockMove(data, null, "remove")
      e.stopPropagation()
    },
    [data, dockMove],
  )

  const onDragStart = React.useCallback(
    (e: DragManager.DragState) => {
      let panel = data.parent
      if (panel.parent.mode === "float" && panel.tabs.length === 1) {
        // when it's the only tab in a float panel, skip this drag, let parent tab bar handle it
        return
      }
      let panelElement = findParentPanel(ref.current)
      let tabGroup = getGroup(data.group)
      let [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup)

      e.setData(
        {
          tab: data,
          panelSize: [panelWidth, panelHeight],
          tabGroup: data.group,
        },
        getDockId(),
      )
      e.startDrag(ref.current.parentElement, ref.current.parentElement)
    },
    [data, getDockId, getGroup],
  )

  const onDragOver = React.useCallback(
    (e: DragManager.DragState) => {
      let dockId = getDockId()
      let tab: TabData = DragManager.DragState.getData("tab", dockId)
      let panel: PanelData = DragManager.DragState.getData("panel", dockId)
      let group: string
      if (tab) {
        panel = tab.parent
        group = tab.group
      } else {
        // drag whole panel
        if (!panel) {
          return
        }
        if (panel?.panelLock) {
          e.reject()
          return
        }
        group = panel.group
      }
      let tabGroup = getGroup(group)
      if (group !== data.group) {
        e.reject()
      } else if (tabGroup?.floatable === "singleTab" && data.parent?.parent?.mode === "float") {
        e.reject()
      } else if (tab && tab !== data) {
        let direction = getDropDirection(e)
        setDropRect(hitAreaRef.current, direction, this)
        e.accept("")
      } else if (panel && panel !== data.parent) {
        let direction = getDropDirection(e)
        setDropRect(hitAreaRef.current, direction, this)
        e.accept("")
      }
    },
    [data, getDockId, getDropDirection, getGroup, setDropRect],
  )

  const onDragLeave = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e: DragManager.DragState) => {
      setDropRect(null, "remove", this)
    },
    [setDropRect],
  )

  const onDrop = React.useCallback(
    (e: DragManager.DragState) => {
      let dockId = getDockId()
      let panel: PanelData
      let tab: TabData = DragManager.DragState.getData("tab", dockId)
      if (tab) {
        panel = tab.parent
      } else {
        panel = DragManager.DragState.getData("panel", dockId)
      }
      if (tab && tab !== data) {
        let direction = getDropDirection(e)
        dockMove(tab, data, direction)
      } else if (panel && panel !== data.parent) {
        let direction = getDropDirection(e)
        dockMove(panel, data, direction)
      }
    },
    [data, dockMove, getDockId, getDropDirection],
  )

  let { id, title, closable, parent } = data

  return (
    <DragDropDiv
      getRef={setRef}
      onDragStartT={onDragStart}
      role="tab"
      aria-selected={parent.activeId === id}
      onDragOverT={onDragOver}
      onDropT={onDrop}
      onDragLeaveT={onDragLeave}
    >
      {title}
      {closable ? <div className="dock-tab-close-btn" onClick={onCloseClick} /> : null}
      <div className="dock-tab-hit-area" ref={setHitAreaRef} />
    </DragDropDiv>
  )
}

interface Props {
  panelData: PanelData
  onPanelDragStart: DragManager.DragHandler
  onPanelDragMove: DragManager.DragHandler
  onPanelDragEnd: DragManager.DragHandler
}

export const DockTabs = ({
  panelData,
  onPanelDragEnd,
  onPanelDragMove,
  onPanelDragStart,
}: Props) => {
  const context = useDockContext()
  const { dockMove, onSilentChange, getGroup } = context

  const onMaximizeClick = React.useCallback(
    (e: React.MouseEvent) => {
      dockMove(panelData, null, "maximize")
      // prevent the focus change logic
      e.stopPropagation()
    },
    [dockMove, panelData],
  )
  const onNewWindowClick = React.useCallback(() => {
    dockMove(panelData, null, "new-window")
  }, [dockMove, panelData])

  const addNewWindowMenu = React.useCallback(
    (element: React.ReactElement, showWithLeftClick: boolean) => {
      const nativeMenu = (
        <Menu onClick={onNewWindowClick}>
          <MenuItem>New Window</MenuItem>
        </Menu>
      )
      return (
        <Dropdown
          prefixCls="dock-dropdown"
          overlay={nativeMenu}
          trigger={showWithLeftClick ? ["contextMenu", "click"] : ["contextMenu"]}
          mouseEnterDelay={0.1}
          mouseLeaveDelay={0.1}
        >
          {element}
        </Dropdown>
      )
    },
    [onNewWindowClick],
  )

  const renderTabBar = React.useCallback(
    (props: any, TabNavList: React.ComponentType) => {
      let { group: groupName, panelLock } = panelData

      let group = getGroup(groupName)
      let { panelExtra } = group

      let maximizable = group.maximizable
      if (panelData.parent.mode === "window") {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        onPanelDragStart = null
        maximizable = false
      }

      if (panelLock) {
        if (panelLock.panelExtra) {
          panelExtra = panelLock.panelExtra
        }
      }

      let showNewWindowButton =
        group.newWindow && isWindowBoxEnabled() && panelData.parent.mode === "float"

      let panelExtraContent: React.ReactElement
      if (panelExtra) {
        panelExtraContent = panelExtra(panelData, context)
      } else if (maximizable || showNewWindowButton) {
        panelExtraContent = (
          <div
            className={
              panelData.parent.mode === "maximize" ? "dock-panel-min-btn" : "dock-panel-max-btn"
            }
            onClick={maximizable ? onMaximizeClick : null}
          />
        )
        if (showNewWindowButton) {
          panelExtraContent = addNewWindowMenu(panelExtraContent, !maximizable)
        }
      }
      return (
        <DockTabBar
          onDragStart={onPanelDragStart}
          onDragMove={onPanelDragMove}
          onDragEnd={onPanelDragEnd}
          TabNavList={TabNavList}
          isMaximized={panelData.parent.mode === "maximize"}
          {...props}
          extra={panelExtraContent}
        />
      )
    },
    [panelData, onPanelDragStart, onPanelDragMove, onPanelDragEnd, panelData, context, getGroup],
  )

  const onTabChange = React.useCallback(
    (activeId: string) => {
      panelData.activeId = activeId
      onSilentChange(activeId, "active")
    },
    [panelData, onSilentChange],
  )

  let { group, tabs, activeId } = panelData

  let tabGroup = getGroup(group)
  let { animated, moreIcon } = tabGroup
  if (animated == null) {
    animated = true
  }
  if (!moreIcon) {
    moreIcon = "..."
  }

  let items: Tab[] = React.useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.id,
        label: <TabLabel data={tab} />,
        children: (
          <DockTabPane key={tab.id} cacheId={tab.id} cached={tab.cached}>
            {typeof tab.content === "function" ? tab.content(tab) : tab.content}
          </DockTabPane>
        ),
      })),
    [tabs],
  )

  return (
    <Tabs
      prefixCls="dock"
      more={{ icon: moreIcon }}
      animated={animated}
      renderTabBar={renderTabBar}
      activeKey={activeId}
      onChange={onTabChange}
      popupClassName={classNames(groupClassNames(group))}
      items={items}
    />
  )
}
