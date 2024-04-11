import * as React from "react"
import {
  BoxData,
  DockMode,
  DropDirection,
  PanelData,
  TabData,
  placeHolderStyle,
  useDockContext,
} from "./DockData"
import { DragDropDiv } from "./dragdrop/DragDropDiv"
import { DragState } from "./dragdrop/DragManager"

interface DockDropSquareProps {
  direction: DropDirection
  depth?: number
  panelData: PanelData
  panelElement: HTMLElement
}

interface DockDropSquareState {
  dropping: boolean
}

export const DockDropSquare = ({
  panelElement,
  direction,
  depth,
  panelData,
}: DockDropSquareProps) => {
  const { setDropRect, getDockId, dockMove } = useDockContext()

  const [state, setState] = React.useState<DockDropSquareState>({
    dropping: false,
  })

  const onDragOver = React.useCallback(
    (e: DragState) => {
      let targetElement = panelElement
      setState({ dropping: true })
      for (let i = 0; i < depth; ++i) {
        targetElement = targetElement.parentElement
      }
      if (panelData.group === placeHolderStyle && direction !== "float") {
        // place holder panel should always have full size drop rect
        setDropRect(targetElement, "middle", this, e)
      } else {
        let dockId = getDockId()
        let panelSize: [number, number] = DragState.getData("panelSize", dockId)
        setDropRect(targetElement, direction, this, e, panelSize)
      }
      e.accept("")
    },
    [panelElement, direction, depth, panelData, setDropRect, getDockId],
  )

  const onDragLeave = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e: DragState) => {
      setState({ dropping: false })
      setDropRect(null, "remove", this)
    },
    [setDropRect],
  )

  const onDrop = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e: DragState) => {
      let dockId = getDockId()
      let source: TabData | PanelData = DragState.getData("tab", dockId)
      if (!source) {
        source = DragState.getData("panel", dockId)
      }
      if (source) {
        let target: PanelData | BoxData = panelData
        for (let i = 0; i < depth; ++i) {
          target = target.parent
        }
        dockMove(source, target, direction)
      }
    },
    [panelData, direction, depth, dockMove, getDockId],
  )

  let classes = ["dock-drop-square"]
  classes.push(`dock-drop-${direction}`)
  if (depth) {
    classes.push(`dock-drop-deep`)
  }

  if (state.dropping) {
    classes.push("dock-drop-square-dropping")
  }

  return (
    <DragDropDiv
      className={classes.join(" ")}
      onDragOverT={onDragOver}
      onDragLeaveT={onDragLeave}
      onDropT={onDrop}
    >
      <div className="dock-drop-square-box" />
    </DragDropDiv>
  )
}

interface DockDropLayerProps {
  panelData: PanelData
  panelElement: HTMLElement
  dropFromPanel: PanelData
}

export const DockDropLayer = ({ panelData, panelElement, dropFromPanel }: DockDropLayerProps) => {
  const { getDockId, getGroup } = useDockContext()

  let dockId = getDockId()

  let children: React.ReactNode[] = []

  // check if it's whole panel dragging
  let draggingPanel = DragState.getData("panel", dockId)

  let fromGroup = getGroup(dropFromPanel.group)
  if (
    fromGroup.floatable !== false &&
    (!draggingPanel ||
      (!draggingPanel.panelLock && // panel with panelLock can't float
        draggingPanel.parent?.mode !== "float" && // don't show float drop when over a float panel
        !(fromGroup.floatable === "singleTab" && draggingPanel.tabs.length > 1))) // singleTab can float only with one tab
  ) {
    children.push(
      <DockDropSquare
        key="float"
        direction="float"
        panelData={panelData}
        panelElement={panelElement}
      />,
    )
  }

  if (draggingPanel !== panelData && !fromGroup.disableDock) {
    // don't drop panel to itself

    // 4 direction base drag square
    utils.addDepthSquare(children, "horizontal", panelData, panelElement, 0)
    utils.addDepthSquare(children, "vertical", panelData, panelElement, 0)

    if (
      !draggingPanel?.panelLock &&
      panelData.group === dropFromPanel.group &&
      panelData !== dropFromPanel
    ) {
      // dock to tabs
      children.push(
        <DockDropSquare
          key="middle"
          direction="middle"
          panelData={panelData}
          panelElement={panelElement}
        />,
      )
    }

    let box = panelData.parent
    if (box && box.children.length > 1) {
      // deeper drop
      utils.addDepthSquare(children, box.mode, panelData, panelElement, 1)
      if (box.parent) {
        utils.addDepthSquare(children, box.parent.mode, panelData, panelElement, 2)
      }
    }
  }

  return <div className="dock-drop-layer">{children}</div>
}

const utils = {
  addDepthSquare(
    children: React.ReactNode[],
    mode: DockMode,
    panelData: PanelData,
    panelElement: HTMLElement,
    depth?: number,
  ) {
    if (mode === "horizontal") {
      children.push(
        <DockDropSquare
          key={`top${depth}`}
          direction="top"
          depth={depth}
          panelData={panelData}
          panelElement={panelElement}
        />,
      )
      children.push(
        <DockDropSquare
          key={`bottom${depth}`}
          direction="bottom"
          depth={depth}
          panelData={panelData}
          panelElement={panelElement}
        />,
      )
    } else {
      children.push(
        <DockDropSquare
          key={`left${depth}`}
          direction="left"
          depth={depth}
          panelData={panelData}
          panelElement={panelElement}
        />,
      )
      children.push(
        <DockDropSquare
          key={`right${depth}`}
          direction="right"
          depth={depth}
          panelData={panelData}
          panelElement={panelElement}
        />,
      )
    }
  },
}
