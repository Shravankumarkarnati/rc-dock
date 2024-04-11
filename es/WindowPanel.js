import NewWindow from "rc-new-window";
import { mapElementToScreenRect, mapWindowToElement } from "rc-new-window/lib/ScreenPosition";
import * as React from "react";
import { useDockContext } from "./DockData";
import { DockPanel } from "./DockPanel";
export const WindowPanel = ({ panelData }) => {
    const { dockMove, getRootElement } = useDockContext();
    const window = React.useRef(null);
    const onOpen = React.useCallback((w) => {
        if (!window.current && w) {
            window.current = w;
        }
    }, []);
    const onUnload = React.useCallback(() => {
        let layoutRoot = getRootElement();
        const rect = mapWindowToElement(layoutRoot, window.current);
        if (rect.width > 0 && rect.height > 0) {
            panelData.x = rect.left;
            panelData.y = rect.top;
            panelData.w = rect.width;
            panelData.h = rect.height;
        }
        dockMove(panelData, null, "float");
    }, [panelData, dockMove, getRootElement]);
    const initPopupInnerRect = React.useCallback(() => {
        return mapElementToScreenRect(getRootElement(), {
            left: panelData.x,
            top: panelData.y,
            width: panelData.w,
            height: panelData.h,
        });
    }, [getRootElement, panelData]);
    let { w, h } = panelData;
    return (React.createElement(NewWindow, { copyStyles: true, onOpen: onOpen, onClose: onUnload, onBlock: onUnload, initPopupInnerRect: initPopupInnerRect, width: w, height: h },
        React.createElement("div", { className: "dock-wbox" },
            React.createElement(DockPanel, { size: panelData.size, panelData: panelData, key: panelData.id }))));
};
