import * as React from "react";
import { DockPanel } from "./DockPanel";
export const FloatBox = React.memo(function FloatBoxBase({ boxData }) {
    const { children } = boxData;
    const childrenRender = [];
    for (const child of children) {
        if ("tabs" in child) {
            childrenRender.push(React.createElement(DockPanel, { size: child.size, panelData: child, key: child.id }));
        }
    }
    return React.createElement("div", { className: "dock-box dock-fbox" }, childrenRender);
});
