import NewWindow, { mapElementToScreenRect, mapWindowToElement } from "./packages/rc-new-window";
import * as React from "react";
import { useDockContext } from "./DockData";
import { DockPanel } from "./DockPanel";
export const WindowPanel = ({ panelData }) => {
    const { dockMove, getRootElement } = useDockContext();
    let { w, h, x, y } = panelData;
    const onUnload = React.useCallback((window) => {
        let newPanelData = panelData;
        let layoutRoot = getRootElement();
        const rect = mapWindowToElement(layoutRoot, window);
        if (rect && rect.width > 0 && rect.height > 0) {
            newPanelData.x = rect.left;
            newPanelData.y = rect.top;
            newPanelData.w = rect.width;
            newPanelData.h = rect.height;
        }
        dockMove(newPanelData, null, "float");
    }, [panelData, dockMove, getRootElement]);
    const initPopupInnerRect = React.useCallback(() => {
        return mapElementToScreenRect(getRootElement(), {
            left: x,
            top: y,
            width: w,
            height: h,
        });
    }, [getRootElement, h, w, x, y]);
    return (React.createElement(NewWindow, { copyStyles: true, onClose: onUnload, onBlock: onUnload, initPopupInnerRect: initPopupInnerRect, width: w, height: h },
        React.createElement("div", { className: "dock-wbox" },
            React.createElement(DockPanel, { size: panelData.size, panelData: panelData, key: panelData.id }))));
};
