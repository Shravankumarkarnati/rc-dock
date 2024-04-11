import * as React from "react"
import { BoxData, PanelData } from "./DockData"
import { DockPanel } from "./DockPanel"

interface Props {
  boxData: BoxData
}

export const MaxBox = ({ boxData: { children } }: Props) => {
  // a place holder panel data to be used during hide animation
  let hidePanelData: PanelData
  let panelData = children[0] as PanelData

  if (panelData) {
    hidePanelData = { ...panelData, id: "", tabs: [] }
    return (
      <div className="dock-box dock-mbox dock-mbox-show">
        <DockPanel size={100} panelData={panelData} />
      </div>
    )
  } else if (hidePanelData) {
    // use the hiden data only once, dont keep it for too long
    let _hidePanelData = hidePanelData
    hidePanelData = null
    return (
      <div className="dock-box dock-mbox dock-mbox-hide">
        <DockPanel size={100} panelData={_hidePanelData} />
      </div>
    )
  } else {
    return <div className="dock-box dock-mbox dock-mbox-hide" />
  }
}
