import NewWindow from "rc-new-window";
import { mapElementToScreenRect, mapWindowToElement, } from "rc-new-window/lib/ScreenPosition";
import * as React from "react";
import { useDockContext } from "./DockData";
import { DockPanel } from "./DockPanel";
export const WindowPanel = React.memo(function WindowPanelBase({ panelData, }) {
    const context = useDockContext();
    const _window = React.useRef(null);
    const onOpen = React.useCallback((_w) => {
        if (!_window.current && _w) {
            _window.current = _w;
        }
    }, []);
    const onUnload = React.useCallback(() => {
        let layoutRoot = context.getRootElement();
        const rect = mapWindowToElement(layoutRoot, _window.current);
        if (rect.width > 0 && rect.height > 0) {
            panelData.x = rect.left;
            panelData.y = rect.top;
            panelData.w = rect.width;
            panelData.h = rect.height;
        }
        context.dockMove(panelData, null, "float");
    }, [panelData, context.getRootElement, context.dockMove]);
    const initPopupInnerRect = React.useCallback(() => {
        return mapElementToScreenRect(context.getRootElement(), {
            left: panelData.x,
            top: panelData.y,
            width: panelData.w,
            height: panelData.h,
        });
    }, [context.getRootElement, panelData]);
    return (React.createElement(NewWindow, { copyStyles: true, onOpen: onOpen, onClose: onUnload, onBlock: onUnload, initPopupInnerRect: initPopupInnerRect, width: panelData.w, height: panelData.h },
        React.createElement("div", { className: "dock-wbox" },
            React.createElement(DockPanel, { size: panelData.size, panelData: panelData, key: panelData.id }))));
});
