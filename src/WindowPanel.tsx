import NewWindow from "rc-new-window"
import { mapElementToScreenRect, mapWindowToElement } from "rc-new-window/lib/ScreenPosition"
import * as React from "react"
import { PanelData, useDockContext } from "./DockData"
import { DockPanel } from "./DockPanel"

interface Props {
  panelData: PanelData
}

export const WindowPanel = ({ panelData }: Props) => {
  const { dockMove, getRootElement } = useDockContext()

  const window = React.useRef<Window | null>(null)

  const onOpen = React.useCallback((w: Window) => {
    if (!window.current && w) {
      window.current = w
    }
  }, [])

  let { w, h, x, y } = panelData

  const onUnload = React.useCallback(() => {
    let newPanelData = panelData
    let layoutRoot = getRootElement()
    const rect = mapWindowToElement(layoutRoot, window.current)

    if (rect.width > 0 && rect.height > 0) {
      newPanelData.x = rect.left
      newPanelData.y = rect.top
      newPanelData.w = rect.width
      newPanelData.h = rect.height
    }
    dockMove(newPanelData, null, "float")
  }, [panelData, dockMove, getRootElement])

  const initPopupInnerRect = React.useCallback(() => {
    return mapElementToScreenRect(getRootElement(), {
      left: x,
      top: y,
      width: w,
      height: h,
    }) as any
  }, [getRootElement, h, w, x, y])

  return (
    <NewWindow
      copyStyles
      onOpen={onOpen}
      onClose={onUnload}
      onBlock={onUnload}
      initPopupInnerRect={initPopupInnerRect}
      width={w}
      height={h}
    >
      <div className="dock-wbox">
        <DockPanel size={panelData.size} panelData={panelData} key={panelData.id} />
      </div>
    </NewWindow>
  )
}
