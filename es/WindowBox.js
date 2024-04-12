import * as React from "react";
import { WindowPanel } from "./WindowPanel";
import { BrowserPopupWindow } from "./packages/rc-new-window";
export const WindowBox = ({ boxData: { children } }) => {
    let childrenRender = [];
    for (let child of children) {
        if ("tabs" in child) {
            childrenRender.push(React.createElement(WindowPanel, { key: child.id, panelData: child }));
        }
    }
    return React.createElement(React.Fragment, null, childrenRender);
};
export const isWindowBoxEnabled = () => BrowserPopupWindow.popupSupported;
