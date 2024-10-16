import * as React from "react";
import { WindowPanel } from "./WindowPanel";
export const WindowBox = React.memo(function WindowBoxBase({ boxData }) {
    let { children } = boxData;
    let childrenRender = [];
    for (let child of children) {
        if ("tabs" in child) {
            childrenRender.push(React.createElement(WindowPanel, { key: child.id, panelData: child }));
        }
    }
    return React.createElement(React.Fragment, null, childrenRender);
});
export const isWindowBoxEnabled = () => typeof window === "object" &&
    ((window === null || window === void 0 ? void 0 : window.navigator.platform) === "Win32" ||
        (window === null || window === void 0 ? void 0 : window.navigator.platform) === "MacIntel");
