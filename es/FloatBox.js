import * as React from "react";
import { DockPanel } from "./DockPanel";
export const FloatBox = ({ boxData }) => {
    var _a;
    let childrenRender = [];
    for (let child of (_a = boxData === null || boxData === void 0 ? void 0 : boxData.children) !== null && _a !== void 0 ? _a : []) {
        if ("tabs" in child) {
            childrenRender.push(React.createElement(DockPanel, { size: child.size, panelData: child, key: child.id }));
        }
    }
    return React.createElement("div", { className: "dock-box dock-fbox" }, childrenRender);
};
