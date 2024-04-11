import * as React from "react";
import { DockPanel } from "./DockPanel";
export const MaxBox = ({ boxData: { children } }) => {
    // a place holder panel data to be used during hide animation
    let hidePanelData;
    let panelData = children[0];
    if (panelData) {
        hidePanelData = Object.assign(Object.assign({}, panelData), { id: "", tabs: [] });
        return (React.createElement("div", { className: "dock-box dock-mbox dock-mbox-show" },
            React.createElement(DockPanel, { size: 100, panelData: panelData })));
    }
    else if (hidePanelData) {
        // use the hiden data only once, dont keep it for too long
        let _hidePanelData = hidePanelData;
        hidePanelData = null;
        return (React.createElement("div", { className: "dock-box dock-mbox dock-mbox-hide" },
            React.createElement(DockPanel, { size: 100, panelData: _hidePanelData })));
    }
    else {
        return React.createElement("div", { className: "dock-box dock-mbox dock-mbox-hide" });
    }
};
