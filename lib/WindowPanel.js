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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowPanel = void 0;
const rc_new_window_1 = __importDefault(require("rc-new-window"));
const ScreenPosition_1 = require("rc-new-window/lib/ScreenPosition");
const React = __importStar(require("react"));
const DockData_1 = require("./DockData");
const DockPanel_1 = require("./DockPanel");
const WindowPanel = ({ panelData }) => {
    const { dockMove, getRootElement } = (0, DockData_1.useDockContext)();
    const window = React.useRef(null);
    const onOpen = React.useCallback((w) => {
        if (!window.current && w) {
            window.current = w;
        }
    }, []);
    const onUnload = React.useCallback(() => {
        let layoutRoot = getRootElement();
        const rect = (0, ScreenPosition_1.mapWindowToElement)(layoutRoot, window.current);
        if (rect.width > 0 && rect.height > 0) {
            panelData.x = rect.left;
            panelData.y = rect.top;
            panelData.w = rect.width;
            panelData.h = rect.height;
        }
        dockMove(panelData, null, "float");
    }, [panelData, dockMove, getRootElement]);
    const initPopupInnerRect = React.useCallback(() => {
        return (0, ScreenPosition_1.mapElementToScreenRect)(getRootElement(), {
            left: panelData.x,
            top: panelData.y,
            width: panelData.w,
            height: panelData.h,
        });
    }, [getRootElement, panelData]);
    let { w, h } = panelData;
    return (React.createElement(rc_new_window_1.default, { copyStyles: true, onOpen: onOpen, onClose: onUnload, onBlock: onUnload, initPopupInnerRect: initPopupInnerRect, width: w, height: h },
        React.createElement("div", { className: "dock-wbox" },
            React.createElement(DockPanel_1.DockPanel, { size: panelData.size, panelData: panelData, key: panelData.id }))));
};
exports.WindowPanel = WindowPanel;
