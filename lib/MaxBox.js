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
exports.MaxBox = void 0;
const React = __importStar(require("react"));
const DockPanel_1 = require("./DockPanel");
const MaxBox = ({ boxData }) => {
    var _a;
    // there can only be one max box
    const panelData = (_a = boxData === null || boxData === void 0 ? void 0 : boxData.children) === null || _a === void 0 ? void 0 : _a[0];
    if (panelData && "tabs" in panelData) {
        return (React.createElement("div", { className: "dock-box dock-mbox dock-mbox-show" },
            React.createElement(DockPanel_1.DockPanel, { size: 100, panelData: panelData })));
    }
    return React.createElement("div", { className: "dock-box dock-mbox dock-mbox-hide" });
};
exports.MaxBox = MaxBox;
