"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowPanel = void 0;
const rc_new_window_1 = __importStar(require("./packages/rc-new-window"));
const React = __importStar(require("react"));
const DockData_1 = require("./DockData");
const DockPanel_1 = require("./DockPanel");
const WindowPanel = ({ panelData }) => {
    const { dockMove, getRootElement } = (0, DockData_1.useDockContext)();
    let { w, h, x, y } = panelData;
    const onUnload = React.useCallback((window) => {
        let newPanelData = panelData;
        let layoutRoot = getRootElement();
        const rect = (0, rc_new_window_1.mapWindowToElement)(layoutRoot, window);
        if (rect && rect.width > 0 && rect.height > 0) {
            newPanelData.x = rect.left;
            newPanelData.y = rect.top;
            newPanelData.w = rect.width;
            newPanelData.h = rect.height;
        }
        dockMove(newPanelData, null, "float");
    }, [panelData, dockMove, getRootElement]);
    const initPopupInnerRect = React.useCallback(() => {
        return (0, rc_new_window_1.mapElementToScreenRect)(getRootElement(), {
            left: x,
            top: y,
            width: w,
            height: h,
        });
    }, [getRootElement, h, w, x, y]);
    return (React.createElement(rc_new_window_1.default, { copyStyles: true, onClose: onUnload, onBlock: onUnload, initPopupInnerRect: initPopupInnerRect, width: w, height: h },
        React.createElement("div", { className: "dock-wbox" },
            React.createElement(DockPanel_1.DockPanel, { size: panelData.size, panelData: panelData, key: panelData.id }))));
};
exports.WindowPanel = WindowPanel;
