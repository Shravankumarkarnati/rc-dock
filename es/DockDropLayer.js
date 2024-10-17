import * as React from "react";
import { placeHolderStyle, useDockContext, } from "./DockData";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import { DragState } from "./dragdrop/DragManager";
export const DockDropSquare = React.memo(function DockDropSquareBase(props) {
    const context = useDockContext();
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
        if (panelData.group === placeHolderStyle && direction !== "float") {
            // place holder panel should always have full size drop rect
            context.setDropRect(_targetElement, "middle", ref, e);
        }
        else {
            let panelSize = DragState.getData("panelSize", dockId);
            context.setDropRect(_targetElement, direction, ref, e, panelSize);
        }
        e.accept("");
    }, [
        ref,
        targetElement,
        panelData.group,
        direction,
        depth,
        context.setDropRect,
        dockId,
    ]);
    const onDragLeave = React.useCallback((e) => {
        if (!ref)
            return;
        setState({ dropping: false });
        context.setDropRect(null, "remove", ref);
    }, [ref, context.setDropRect]);
    const onDrop = React.useCallback((e) => {
        let source = DragState.getData("tab", dockId);
        if (!source) {
            source = DragState.getData("panel", dockId);
        }
        if (source) {
            let target = panelData;
            for (let i = 0; i < depth; ++i) {
                target = target.parent;
            }
            context.dockMove(source, target, direction);
        }
    }, [dockId, panelData, context.dockMove, direction, depth]);
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
    return (React.createElement(DragDropDiv, { className: classes.join(" "), onDragOverT: onDragOver, onDragLeaveT: onDragLeave, onDropT: onDrop, getRef: setRef },
        React.createElement("div", { className: "dock-drop-square-box" })));
});
export const DockDropLayer = React.memo(function DockDropLayerBase(props) {
    var _a;
    const context = useDockContext();
    let { panelData, panelElement, dropFromPanel } = props;
    let dockId = context.getDockId();
    let children = [];
    // check if it's whole panel dragging
    let draggingPanel = DragState.getData("panel", dockId);
    let fromGroup = context.getGroup(dropFromPanel.group);
    if (fromGroup.floatable !== false &&
        (!draggingPanel ||
            (!draggingPanel.panelLock && // panel with panelLock can't float
                ((_a = draggingPanel.parent) === null || _a === void 0 ? void 0 : _a.mode) !== "float" && // don't show float drop when over a float panel
                !(fromGroup.floatable === "singleTab" && draggingPanel.tabs.length > 1))) // singleTab can float only with one tab
    ) {
        children.push(React.createElement(DockDropSquare, { key: "float", direction: "float", panelData: panelData, panelElement: panelElement }));
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
            children.push(React.createElement(DockDropSquare, { key: "middle", direction: "middle", panelData: panelData, panelElement: panelElement }));
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
        newChildren.push(React.createElement(DockDropSquare, { key: `top${depth}`, direction: "top", depth: depth, panelData: panelData, panelElement: panelElement }), React.createElement(DockDropSquare, { key: `bottom${depth}`, direction: "bottom", depth: depth, panelData: panelData, panelElement: panelElement }));
    }
    else {
        newChildren.push(React.createElement(DockDropSquare, { key: `left${depth}`, direction: "left", depth: depth, panelData: panelData, panelElement: panelElement }), React.createElement(DockDropSquare, { key: `right${depth}`, direction: "right", depth: depth, panelData: panelData, panelElement: panelElement }));
    }
    return newChildren;
};
