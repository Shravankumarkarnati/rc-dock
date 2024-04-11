var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import * as React from "react";
import { Divider } from "./Divider";
import { useForceUpdate } from "./UseForceUpdate";
export const DividerBox = (_a) => {
    var { children, mode, className } = _a, props = __rest(_a, ["children", "mode", "className"]);
    const [ref, setRef] = React.useState(null);
    const forceUpdate = useForceUpdate();
    const getDividerData = React.useCallback((idx) => {
        if (!ref) {
            return null;
        }
        let nodes = ref.childNodes;
        let length = 1;
        if (Array.isArray(children)) {
            length = children.length;
        }
        if (nodes.length !== length * 2 - 1) {
            return;
        }
        let dividerChildren = [];
        for (let i = 0; i < length; ++i) {
            if (mode === "vertical") {
                dividerChildren.push({
                    size: nodes[i * 2].offsetHeight,
                });
            }
            else {
                dividerChildren.push({
                    size: nodes[i * 2].offsetWidth,
                });
            }
        }
        return {
            element: ref,
            beforeDivider: dividerChildren.slice(0, idx),
            afterDivider: dividerChildren.slice(idx),
        };
    }, [children, mode, ref]);
    const changeSizes = React.useCallback((sizes) => {
        let nodes = ref.childNodes;
        if (nodes.length === sizes.length * 2 - 1) {
            for (let i = 0; i < sizes.length; ++i) {
                if (mode === "vertical") {
                    ;
                    nodes[i * 2].style.height = `${sizes[i]}px`;
                }
                else {
                    ;
                    nodes[i * 2].style.width = `${sizes[i]}px`;
                }
            }
            forceUpdate();
        }
    }, [forceUpdate, mode, ref.childNodes]);
    let isVertical = mode === "vertical";
    let childrenRender = [];
    if (Array.isArray(children)) {
        for (let i = 0; i < children.length; ++i) {
            if (i > 0) {
                ;
                childrenRender.push(React.createElement(Divider, { idx: i, key: i, isVertical: isVertical, getDividerData: getDividerData, changeSizes: changeSizes }));
            }
            ;
            childrenRender.push(children[i]);
        }
    }
    else {
        childrenRender = children;
    }
    let cls;
    if (mode === "vertical") {
        cls = "divider-box dock-vbox";
    }
    else {
        cls = "divider-box dock-hbox";
    }
    if (className) {
        cls = `${cls} ${className}`;
    }
    return (React.createElement("div", Object.assign({ ref: setRef, className: cls }, props), childrenRender));
};
