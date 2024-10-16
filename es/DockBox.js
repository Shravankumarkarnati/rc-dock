import * as React from "react";
import { useDockContext, } from "./DockData";
import { Divider } from "./Divider";
import { DockPanel } from "./DockPanel";
import { useForceUpdate } from "./UseForceUpdate";
export const DockBox = React.memo(function DockBoxBase(props) {
    const context = useDockContext();
    const forceUpdate = useForceUpdate();
    const _ref = React.useRef(null);
    const getRef = React.useCallback((r) => {
        _ref.current = r;
    }, []);
    let { boxData } = props;
    let { minWidth, minHeight, size, children, mode, id, widthFlex, heightFlex } = boxData;
    const getDividerData = React.useCallback((idx) => {
        if (!_ref.current) {
            return null;
        }
        let nodes = _ref.current.childNodes;
        if (nodes.length !== children.length * 2 - 1) {
            return;
        }
        let dividerChildren = [];
        for (let i = 0; i < children.length; ++i) {
            if (mode === "vertical") {
                dividerChildren.push({
                    size: nodes[i * 2].offsetHeight,
                    minSize: children[i].minHeight,
                });
            }
            else {
                dividerChildren.push({
                    size: nodes[i * 2].offsetWidth,
                    minSize: children[i].minWidth,
                });
            }
        }
        return {
            element: _ref.current,
            beforeDivider: dividerChildren.slice(0, idx),
            afterDivider: dividerChildren.slice(idx),
        };
    }, [children, mode]);
    const changeSizes = React.useCallback((sizes) => {
        if (children.length !== sizes.length) {
            return;
        }
        for (let i = 0; i < children.length; ++i) {
            children[i].size = sizes[i];
        }
        forceUpdate();
    }, [children, forceUpdate]);
    const onDragEnd = React.useCallback(() => {
        context.onSilentChange(null, "move");
    }, [context.onSilentChange]);
    let isVertical = mode === "vertical";
    let childrenRender = [];
    for (let i = 0; i < children.length; ++i) {
        if (i > 0) {
            childrenRender.push(React.createElement(Divider, { idx: i, key: i, isVertical: isVertical, onDragEnd: onDragEnd, getDividerData: getDividerData, changeSizes: changeSizes }));
        }
        let child = children[i];
        if ("tabs" in child) {
            childrenRender.push(React.createElement(DockPanel, { size: child.size, panelData: child, key: child.id }));
            // render DockPanel
        }
        else if ("children" in child) {
            childrenRender.push(React.createElement(DockBox, { size: child.size, boxData: child, key: child.id }));
        }
    }
    let cls;
    let flex = 1;
    if (mode === "vertical") {
        cls = "dock-box dock-vbox";
        if (widthFlex != null) {
            flex = widthFlex;
        }
    }
    else {
        // since special boxes dont reuse this render function, this can only be horizontal box
        cls = "dock-box dock-hbox";
        if (heightFlex != null) {
            flex = heightFlex;
        }
    }
    let flexGrow = flex * size;
    let flexShrink = flex * 1000000;
    if (flexShrink < 1) {
        flexShrink = 1;
    }
    return (React.createElement("div", { ref: getRef, className: cls, "data-dockid": id, style: {
            minWidth,
            minHeight,
            flex: `${flexGrow} ${flexShrink} ${size}px`,
        } }, childrenRender));
});
