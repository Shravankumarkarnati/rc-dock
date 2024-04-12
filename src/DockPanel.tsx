import classNames from "classnames"
import * as React from "react"
import { getFloatPanelSize, nextZIndex } from "./Algorithm"
import { PanelData, TabData, useDockContext } from "./DockData"
import { DockDropEdge } from "./DockDropEdge"
import { DockDropLayer } from "./DockDropLayer"
import { DockTabs } from "./DockTabs"
import { useForceUpdate } from "./UseForceUpdate"
import { groupClassNames } from "./Utils"
import { DragDropDiv } from "./dragdrop/DragDropDiv"
import { DragState } from "./dragdrop/DragManager"

interface Props {
  panelData: PanelData
  size: number
}

interface State {
  dropFromPanel: PanelData
  draggingHeader: boolean
}

type DockPanelRef = {
  id: string
  onDragOverOtherPanel: () => void
}

export const DockPanel = ({ panelData, size }: Props) => {
  const { getDockId, getGroup, getLayoutSize, onSilentChange, shouldUseEdgeDrop } = useDockContext()

  const panelId = React.useId()
  const [ref, setRef] = React.useState<null | HTMLDivElement>(null)
  const _droppingPanel = React.useRef<DockPanelRef | null>(null)

  const forceUpdate = useForceUpdate()

  const [state, setState] = React.useState<State>({
    dropFromPanel: null,
    draggingHeader: null,
  })

  const droppingPanel = React.useCallback((_panelRef: DockPanelRef) => {
    if (_droppingPanel.current === _panelRef) {
      return
    }
    if (_droppingPanel.current) {
      _droppingPanel.current.onDragOverOtherPanel()
    }
    _droppingPanel.current = _panelRef
  }, [])

  const onDragOver = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e: DragState) => {
      if (_droppingPanel.current && _droppingPanel.current.id === panelId) {
        return
      }

      let dockId = getDockId()
      let tab: TabData = DragState.getData("tab", dockId)
      let panel: PanelData = DragState.getData("panel", dockId)
      if (tab || panel) {
        droppingPanel({
          id: panelId,
          onDragOverOtherPanel: () => setState((prev) => ({ ...prev, dropFromPanel: null })),
        })
      }
      if (tab) {
        if (tab.parent) {
          setState((prev) => ({ ...prev, dropFromPanel: tab.parent }))
        } else {
          // add a fake panel
          setState((prev) => ({
            ...prev,
            dropFromPanel: { activeId: "", tabs: [], group: tab.group },
          }))
        }
      } else if (panel) {
        setState((prev) => ({ ...prev, dropFromPanel: panel }))
      }
    },
    [droppingPanel, getDockId, panelId],
  )

  const movingX = React.useRef<number | null>(null)
  const movingY = React.useRef<number | null>(null)

  const onFloatPointerDown = React.useCallback(() => {
    let { z } = panelData
    let newZ = nextZIndex(z)
    if (newZ !== z) {
      panelData.z = newZ
      forceUpdate()
    }
  }, [forceUpdate, panelData])

  // drop to move in float mode
  let onPanelHeaderDragStart = React.useCallback(
    (event: DragState) => {
      let { parent, x, y } = panelData
      let dockId = getDockId()
      if (parent?.mode === "float") {
        movingX.current = x
        movingY.current = y
        // hide the panel, but not create drag layer element
        event.setData({ panel: panelData, tabGroup: panelData.group }, dockId)
        event.startDrag(null, null)
        onFloatPointerDown()
      } else {
        let tabGroup = getGroup(panelData.group)
        let [panelWidth, panelHeight] = getFloatPanelSize(ref, tabGroup)

        event.setData(
          {
            panel: panelData,
            panelSize: [panelWidth, panelHeight],
            tabGroup: panelData.group,
          },
          dockId,
        )
        event.startDrag(null)
      }
      setState((prev) => ({ ...prev, draggingHeader: true }))
    },
    [panelData, getDockId, onFloatPointerDown, getGroup, ref],
  )

  const onPanelHeaderDragMove = React.useCallback(
    (e: DragState) => {
      if (panelData.parent?.mode !== "float") {
        return
      }
      let { width, height } = getLayoutSize()
      panelData.x = (movingX.current ?? 0) + e.dx
      panelData.y = (movingY.current ?? 0) + e.dy

      if (width > 200 && height > 200) {
        if (panelData.y < 0) {
          panelData.y = 0
        } else if (panelData.y > height - 16) {
          panelData.y = height - 16
        }

        if (panelData.x + panelData.w < 16) {
          panelData.x = 16 - panelData.w
        } else if (panelData.x > width - 16) {
          panelData.x = width - 16
        }
      }
      forceUpdate()
    },
    [panelData, getLayoutSize, forceUpdate],
  )

  const onPanelHeaderDragEnd = React.useCallback(
    (e: DragState) => {
      setState((prev) => ({ ...prev, draggingHeader: false }))
      if (e.dropped === false) {
        if (panelData.parent?.mode === "float") {
          // in float mode, the position change needs to be sent to the layout
          onSilentChange(panelData.activeId, "move")
        }
      }
    },
    [panelData.parent, panelData.activeId, onSilentChange],
  )

  const movingW = React.useRef<number | null>(null)
  const movingH = React.useRef<number | null>(null)
  const movingCorner = React.useRef<string | null>(null)

  const onPanelCornerDrag = React.useCallback(
    (e: DragState, corner: string) => {
      let { parent, x, y, w, h } = panelData
      if (parent?.mode === "float") {
        movingCorner.current = corner
        movingX.current = x
        movingY.current = y
        movingW.current = w
        movingH.current = h
        e.startDrag(null, null)
      }
    },
    [panelData],
  )

  const onPanelCornerDragT = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "t")
    },
    [onPanelCornerDrag],
  )
  const onPanelCornerDragB = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "b")
    },
    [onPanelCornerDrag],
  )
  const onPanelCornerDragL = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "l")
    },
    [onPanelCornerDrag],
  )
  const onPanelCornerDragR = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "r")
    },
    [onPanelCornerDrag],
  )
  const onPanelCornerDragTL = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "tl")
    },
    [onPanelCornerDrag],
  )
  const onPanelCornerDragTR = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "tr")
    },
    [onPanelCornerDrag],
  )
  const onPanelCornerDragBL = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "bl")
    },
    [onPanelCornerDrag],
  )
  const onPanelCornerDragBR = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "br")
    },
    [onPanelCornerDrag],
  )

  const onPanelCornerDragMove = React.useCallback(
    (e: DragState) => {
      let { dx, dy } = e

      if (movingCorner.current.startsWith("t")) {
        // when moving top corners, dont let it move header out of screen
        let { height } = getLayoutSize()
        if (movingY.current + dy < 0) {
          dy = -movingY.current
        } else if (movingY.current + dy > height - 16) {
          dy = height - 16 - movingY.current
        }
      }

      switch (movingCorner.current) {
        case "t": {
          panelData.y = movingY.current + dy
          panelData.h = movingH.current - dy
          break
        }
        case "b": {
          panelData.h = movingH.current + dy
          break
        }
        case "l": {
          panelData.x = movingX.current + dx
          panelData.w = movingW.current - dx
          break
        }
        case "r": {
          panelData.w = movingW.current + dx
          break
        }
        case "tl": {
          panelData.x = movingX.current + dx
          panelData.w = movingW.current - dx
          panelData.y = movingY.current + dy
          panelData.h = movingH.current - dy
          break
        }
        case "tr": {
          panelData.w = movingW.current + dx
          panelData.y = movingY.current + dy
          panelData.h = movingH.current - dy
          break
        }
        case "bl": {
          panelData.x = movingX.current + dx
          panelData.w = movingW.current - dx
          panelData.h = movingH.current + dy
          break
        }
        case "br": {
          panelData.w = movingW.current + dx
          panelData.h = movingH.current + dy
          break
        }
      }

      panelData.w = Math.max(panelData.w || 0, panelData.minWidth || 0)
      panelData.h = Math.max(panelData.h || 0, panelData.minHeight || 0)

      forceUpdate()
    },
    [forceUpdate, getLayoutSize, panelData],
  )

  const onPanelCornerDragEnd = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e: DragState) => {
      onSilentChange(panelData.activeId, "move")
    },
    [onSilentChange, panelData],
  )

  const onPanelClicked = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.nativeEvent.target
      if (
        ref &&
        !ref.contains(ref.ownerDocument.activeElement) &&
        target instanceof Node &&
        ref.contains(target)
      ) {
        ;(ref.querySelector(".dock-bar") as HTMLElement).focus()
      }
    },
    [ref],
  )

  React.useEffect(() => {
    if (ref) {
      let { parent } = panelData
      if (parent?.mode === "float") {
        ref.addEventListener("pointerdown", onFloatPointerDown, {
          capture: true,
          passive: true,
        })
      }
    }

    return () => {
      ref?.removeEventListener("pointerdown", onFloatPointerDown, {
        capture: true,
      })
    }
  }, [onFloatPointerDown, ref, panelData])

  let { dropFromPanel, draggingHeader } = state
  let { minWidth, minHeight, group, id, parent, panelLock } = panelData
  let styleName = group
  let tabGroup = getGroup(group)
  let { widthFlex, heightFlex } = tabGroup
  if (panelLock) {
    let { panelStyle, widthFlex: panelWidthFlex, heightFlex: panelHeightFlex } = panelLock
    if (panelStyle) {
      styleName = panelStyle
    }
    if (typeof panelWidthFlex === "number") {
      widthFlex = panelWidthFlex
    }
    if (typeof panelHeightFlex === "number") {
      heightFlex = panelHeightFlex
    }
  }
  let panelClass: string = classNames(groupClassNames(styleName))
  let isMax = parent?.mode === "maximize"
  let isFloat = parent?.mode === "float"
  let isHBox = parent?.mode === "horizontal"
  let isVBox = parent?.mode === "vertical"

  if (isMax) {
    dropFromPanel = null
    onPanelHeaderDragStart = null
  }
  let cls = `dock-panel ${panelClass ? panelClass : ""}${
    dropFromPanel ? " dock-panel-dropping" : ""
  }${draggingHeader ? " dragging" : ""}`
  let flex = 1
  if (isHBox && widthFlex != null) {
    flex = widthFlex
  } else if (isVBox && heightFlex != null) {
    flex = heightFlex
  }
  let flexGrow = flex * size
  let flexShrink = flex * 1000000
  if (flexShrink < 1) {
    flexShrink = 1
  }
  let style: React.CSSProperties = {
    minWidth,
    minHeight,
    flex: `${flexGrow} ${flexShrink} ${size}px`,
  }
  if (isFloat) {
    style.left = panelData.x
    style.top = panelData.y
    style.width = panelData.w
    style.height = panelData.h
    style.zIndex = panelData.z
  }
  let droppingLayer: React.ReactNode
  if (dropFromPanel) {
    let dropFromGroup = getGroup(dropFromPanel.group)
    let dockId = getDockId()
    if (!dropFromGroup.tabLocked || DragState.getData("tab", dockId) == null) {
      // not allowed locked tab to create new panel
      let DockDropClass = shouldUseEdgeDrop() ? DockDropEdge : DockDropLayer
      droppingLayer = (
        <DockDropClass panelData={panelData} panelElement={ref} dropFromPanel={dropFromPanel} />
      )
    }
  }

  return (
    <DragDropDiv
      getRef={setRef}
      className={cls}
      style={style}
      data-dockid={id}
      onDragOverT={isFloat ? null : onDragOver}
      onClick={onPanelClicked}
    >
      <DockTabs
        panelData={panelData}
        onPanelDragStart={onPanelHeaderDragStart}
        onPanelDragMove={onPanelHeaderDragMove}
        onPanelDragEnd={onPanelHeaderDragEnd}
      />
      {isFloat
        ? [
            <DragDropDiv
              key="drag-size-t"
              className="dock-panel-drag-size dock-panel-drag-size-t"
              onDragStartT={onPanelCornerDragT}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-b"
              className="dock-panel-drag-size dock-panel-drag-size-b"
              onDragStartT={onPanelCornerDragB}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-l"
              className="dock-panel-drag-size dock-panel-drag-size-l"
              onDragStartT={onPanelCornerDragL}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-r"
              className="dock-panel-drag-size dock-panel-drag-size-r"
              onDragStartT={onPanelCornerDragR}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-t-l"
              className="dock-panel-drag-size dock-panel-drag-size-t-l"
              onDragStartT={onPanelCornerDragTL}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-t-r"
              className="dock-panel-drag-size dock-panel-drag-size-t-r"
              onDragStartT={onPanelCornerDragTR}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-b-l"
              className="dock-panel-drag-size dock-panel-drag-size-b-l"
              onDragStartT={onPanelCornerDragBL}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-b-r"
              className="dock-panel-drag-size dock-panel-drag-size-b-r"
              onDragStartT={onPanelCornerDragBR}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
          ]
        : null}
      {droppingLayer}
    </DragDropDiv>
  )
}
