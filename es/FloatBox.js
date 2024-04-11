import * as React from "react";
import { DockPanel } from "./DockPanel";
export const FloatBox = ({ boxData: { children } }) => {
    let childrenRender = [];
    for (let child of children) {
        if ("tabs" in child) {
            childrenRender.push(React.createElement(DockPanel, { size: child.size, panelData: child, key: child.id }));
        }
    }
    return React.createElement("div", { className: "dock-box dock-fbox" }, childrenRender);
};
