import * as React from "react";
import { DockPanel } from "./DockPanel";
export const MaxBox = React.memo(function MaxBoxBase({ boxData }) {
    const panelData = boxData.children[0];
    let hidePanelData;
    if (panelData) {
        hidePanelData = Object.assign(Object.assign({}, panelData), { id: "", tabs: [] });
        return (React.createElement("div", { className: "dock-box dock-mbox dock-mbox-show" },
            React.createElement(DockPanel, { size: 100, panelData: panelData })));
    }
    else if (hidePanelData) {
        // use the hiden data only once, dont keep it for too long
        const _hidePanelData = hidePanelData;
        hidePanelData = null;
        return (React.createElement("div", { className: "dock-box dock-mbox dock-mbox-hide" },
            React.createElement(DockPanel, { size: 100, panelData: _hidePanelData })));
    }
    else {
        return React.createElement("div", { className: "dock-box dock-mbox dock-mbox-hide" });
    }
});
