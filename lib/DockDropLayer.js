"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.DockDropSquare = React.memo(function DockDropSquareBase(props) {
    const context = DockData_1.useDockContext();
    const [ref, setRef] = React.useState(null);
    const [state, setState] = React.useState({
        dropping: false,
    });
    let { panelElement: targetElement, direction, depth, panelData } = props;
    let dockId = context.getDockId();
    const onDragOver = React.useCallback((e) => {
        if (!ref)
            return;
        setState({ dropping: true });
        let _targetElement = targetElement;
        for (let i = 0; i < depth; ++i) {
            if (_targetElement.parentElement) {
                _targetElement = _targetElement.parentElement;
            }
        }
        if (panelData.group === DockData_1.placeHolderStyle && direction !== "float") {
            // place holder panel should always have full size drop rect
            context.setDropRect(_targetElement, "middle", ref, e);
        }
        else {
            let panelSize = DragManager_1.DragState.getData("panelSize", dockId);
            context.setDropRect(_targetElement, direction, ref, e, panelSize);
        }
        e.accept("");
    }, [ref, depth, targetElement, panelData.group, context.setDropRect, dockId]);
    const onDragLeave = React.useCallback((e) => {
        if (!ref)
            return;
        setState({ dropping: false });
        context.setDropRect(null, "remove", ref);
    }, [ref, context.setDropRect]);
    const onDrop = React.useCallback((e) => {
        let source = DragManager_1.DragState.getData("tab", dockId);
        if (!source) {
            source = DragManager_1.DragState.getData("panel", dockId);
        }
        if (source) {
            let target = panelData;
            for (let i = 0; i < depth; ++i) {
                target = target.parent;
            }
            context.dockMove(source, target, direction);
        }
    }, [dockId, context.dockMove, panelData, depth, direction]);
    React.useEffect(() => {
        return () => {
            if (ref) {
                context.setDropRect(null, "remove", ref);
            }
        };
    }, []);
    let classes = ["dock-drop-square"];
    classes.push(`dock-drop-${direction}`);
    if (depth) {
        classes.push(`dock-drop-deep`);
    }
    if (state.dropping) {
        classes.push("dock-drop-square-dropping");
    }
    return (React.createElement(DragDropDiv_1.DragDropDiv, { className: classes.join(" "), onDragOverT: onDragOver, onDragLeaveT: onDragLeave, onDropT: onDrop, getRef: setRef },
        React.createElement("div", { className: "dock-drop-square-box" })));
});
exports.DockDropLayer = React.memo(function DockDropLayerBase(props) {
    var _a;
    const context = DockData_1.useDockContext();
    let { panelData, panelElement, dropFromPanel } = props;
    let dockId = context.getDockId();
    let children = [];
    // check if it's whole panel dragging
    let draggingPanel = DragManager_1.DragState.getData("panel", dockId);
    let fromGroup = context.getGroup(dropFromPanel.group);
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
        children = addDepthSquare(children, "horizontal", panelData, panelElement, 0);
        children = addDepthSquare(children, "vertical", panelData, panelElement, 0);
        if (!(draggingPanel === null || draggingPanel === void 0 ? void 0 : draggingPanel.panelLock) &&
            panelData.group === dropFromPanel.group &&
            panelData !== dropFromPanel) {
            // dock to tabs
            children.push(React.createElement(exports.DockDropSquare, { key: "middle", direction: "middle", panelData: panelData, panelElement: panelElement }));
        }
        let box = panelData.parent;
        if (box && box.children.length > 1) {
            // deeper drop
            children = addDepthSquare(children, box.mode, panelData, panelElement, 1);
            if (box.parent) {
                children = addDepthSquare(children, box.parent.mode, panelData, panelElement, 2);
            }
        }
    }
    return React.createElement("div", { className: "dock-drop-layer" }, children);
});
const addDepthSquare = (children, mode, panelData, panelElement, depth) => {
    const newChildren = children;
    if (mode === "horizontal") {
        newChildren.push(React.createElement(exports.DockDropSquare, { key: `top${depth}`, direction: "top", depth: depth, panelData: panelData, panelElement: panelElement }), React.createElement(exports.DockDropSquare, { key: `bottom${depth}`, direction: "bottom", depth: depth, panelData: panelData, panelElement: panelElement }));
    }
    else {
        newChildren.push(React.createElement(exports.DockDropSquare, { key: `left${depth}`, direction: "left", depth: depth, panelData: panelData, panelElement: panelElement }), React.createElement(exports.DockDropSquare, { key: `right${depth}`, direction: "right", depth: depth, panelData: panelData, panelElement: panelElement }));
    }
    return newChildren;
};
