import * as React from "react"
import { BoxData, PanelData } from "./DockData"
import { DockPanel } from "./DockPanel"

interface Props {
  boxData: BoxData
}

export const MaxBox = ({ boxData: { children } }: Props) => {
  // a place holder panel data to be used during hide animation
  let hidePanelData: PanelData
  let panelData = children[0] as PanelData | undefined

  if (panelData) {
    hidePanelData = { ...panelData, id: "", tabs: [] }
    return (
      <div className="dock-box dock-mbox dock-mbox-show">
        <DockPanel size={100} panelData={panelData} />
      </div>
    )
  } else if (hidePanelData) {
    return (
      <div className="dock-box dock-mbox dock-mbox-hide">
        <DockPanel size={100} panelData={hidePanelData} />
      </div>
    )
  } else {
    return <div className="dock-box dock-mbox dock-mbox-hide" />
  }
}
