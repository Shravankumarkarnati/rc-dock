import * as React from "react"
import { BoxData } from "./DockData"
import { DockPanel } from "./DockPanel"

interface Props {
  boxData?: BoxData
}

export const MaxBox = ({ boxData }: Props) => {
  // there can only be one max box
  const panelData = boxData?.children?.[0]

  if (panelData && "tabs" in panelData) {
    return (
      <div className="dock-box dock-mbox dock-mbox-show">
        <DockPanel size={100} panelData={panelData} />
      </div>
    )
  }

  return <div className="dock-box dock-mbox dock-mbox-hide" />
}
