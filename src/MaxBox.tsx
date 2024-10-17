import * as React from "react";
import { BoxData, PanelData } from "./DockData";
import { DockPanel } from "./DockPanel";

interface Props {
  boxData: BoxData;
}

export const MaxBox = React.memo(function MaxBoxBase({ boxData }: Props) {
  const panelData = boxData.children[0] as PanelData;
  let hidePanelData: PanelData;

  if (panelData) {
    hidePanelData = { ...panelData, id: "", tabs: [] };
    return (
      <div className="dock-box dock-mbox dock-mbox-show">
        <DockPanel size={100} panelData={panelData} />
      </div>
    );
  } else if (hidePanelData) {
    // use the hiden data only once, dont keep it for too long
    const _hidePanelData = hidePanelData;
    hidePanelData = null;
    return (
      <div className="dock-box dock-mbox dock-mbox-hide">
        <DockPanel size={100} panelData={_hidePanelData} />
      </div>
    );
  } else {
    return <div className="dock-box dock-mbox dock-mbox-hide" />;
  }
});
