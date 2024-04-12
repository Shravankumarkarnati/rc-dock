import * as React from "react";
import { DockPanel } from "./DockPanel";
export const MaxBox = ({ boxData }) => {
    var _a;
    // there can only be one max box
    const panelData = (_a = boxData === null || boxData === void 0 ? void 0 : boxData.children) === null || _a === void 0 ? void 0 : _a[0];
    if (panelData && "tabs" in panelData) {
        return (React.createElement("div", { className: "dock-box dock-mbox dock-mbox-show" },
            React.createElement(DockPanel, { size: 100, panelData: panelData })));
    }
    return React.createElement("div", { className: "dock-box dock-mbox dock-mbox-hide" });
};
