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
exports.DockDropLayer = exports.DockDropSquare = void 0;
const React = __importStar(require("react"));
const DockData_1 = require("./DockData");
const DragDropDiv_1 = require("./dragdrop/DragDropDiv");
const DragManager_1 = require("./dragdrop/DragManager");
const DockDropSquare = ({ panelElement, direction, depth, panelData, }) => {
    const { setDropRect, getDockId, dockMove } = (0, DockData_1.useDockContext)();
    const [state, setState] = React.useState({
        dropping: false,
    });
    const onDragOver = React.useCallback((e) => {
        let targetElement = panelElement;
        setState({ dropping: true });
        for (let i = 0; i < depth; ++i) {
            targetElement = targetElement.parentElement;
        }
        if (panelData.group === DockData_1.placeHolderStyle && direction !== "float") {
            // place holder panel should always have full size drop rect
            setDropRect(targetElement, "middle", this, e);
        }
        else {
            let dockId = getDockId();
            let panelSize = DragManager_1.DragState.getData("panelSize", dockId);
            setDropRect(targetElement, direction, this, e, panelSize);
        }
        e.accept("");
    }, [panelElement, direction, depth, panelData, setDropRect, getDockId]);
    const onDragLeave = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e) => {
        setState({ dropping: false });
        setDropRect(null, "remove", this);
    }, [setDropRect]);
    const onDrop = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e) => {
        let dockId = getDockId();
        let source = DragManager_1.DragState.getData("tab", dockId);
        if (!source) {
            source = DragManager_1.DragState.getData("panel", dockId);
        }
        if (source) {
            let target = panelData;
            for (let i = 0; i < depth; ++i) {
                target = target.parent;
            }
            dockMove(source, target, direction);
        }
    }, [panelData, direction, depth, dockMove, getDockId]);
    let classes = ["dock-drop-square"];
    classes.push(`dock-drop-${direction}`);
    if (depth) {
        classes.push(`dock-drop-deep`);
    }
    if (state.dropping) {
        classes.push("dock-drop-square-dropping");
    }
    return (React.createElement(DragDropDiv_1.DragDropDiv, { className: classes.join(" "), onDragOverT: onDragOver, onDragLeaveT: onDragLeave, onDropT: onDrop },
        React.createElement("div", { className: "dock-drop-square-box" })));
};
exports.DockDropSquare = DockDropSquare;
const DockDropLayer = ({ panelData, panelElement, dropFromPanel }) => {
    var _a;
    const { getDockId, getGroup } = (0, DockData_1.useDockContext)();
    let dockId = getDockId();
    let children = [];
    // check if it's whole panel dragging
    let draggingPanel = DragManager_1.DragState.getData("panel", dockId);
    let fromGroup = getGroup(dropFromPanel.group);
    if (fromGroup.floatable !== false &&
        (!draggingPanel ||
            (!draggingPanel.panelLock && // panel with panelLock can't float
                ((_a = draggingPanel.parent) === null || _a === void 0 ? void 0 : _a.mode) !== "float" && // don't show float drop when over a float panel
                !(fromGroup.floatable === "singleTab" && draggingPanel.tabs.length > 1))) // singleTab can float only with one tab
    ) {
        children.push(React.createElement(exports.DockDropSquare, { key: "float", direction: "float", panelData: panelData, panelElement: panelElement }));
    }
    if (draggingPanel !== panelData && !fromGroup.disableDock) {
        // don't drop panel to itself
        // 4 direction base drag square
        utils.addDepthSquare(children, "horizontal", panelData, panelElement, 0);
        utils.addDepthSquare(children, "vertical", panelData, panelElement, 0);
        if (!(draggingPanel === null || draggingPanel === void 0 ? void 0 : draggingPanel.panelLock) &&
            panelData.group === dropFromPanel.group &&
            panelData !== dropFromPanel) {
            // dock to tabs
            children.push(React.createElement(exports.DockDropSquare, { key: "middle", direction: "middle", panelData: panelData, panelElement: panelElement }));
        }
        let box = panelData.parent;
        if (box && box.children.length > 1) {
            // deeper drop
            utils.addDepthSquare(children, box.mode, panelData, panelElement, 1);
            if (box.parent) {
                utils.addDepthSquare(children, box.parent.mode, panelData, panelElement, 2);
            }
        }
    }
    return React.createElement("div", { className: "dock-drop-layer" }, children);
};
exports.DockDropLayer = DockDropLayer;
const utils = {
    addDepthSquare(children, mode, panelData, panelElement, depth) {
        if (mode === "horizontal") {
            children.push(React.createElement(exports.DockDropSquare, { key: `top${depth}`, direction: "top", depth: depth, panelData: panelData, panelElement: panelElement }));
            children.push(React.createElement(exports.DockDropSquare, { key: `bottom${depth}`, direction: "bottom", depth: depth, panelData: panelData, panelElement: panelElement }));
        }
        else {
            children.push(React.createElement(exports.DockDropSquare, { key: `left${depth}`, direction: "left", depth: depth, panelData: panelData, panelElement: panelElement }));
            children.push(React.createElement(exports.DockDropSquare, { key: `right${depth}`, direction: "right", depth: depth, panelData: panelData, panelElement: panelElement }));
        }
    },
};
