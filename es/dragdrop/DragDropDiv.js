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
import * as DragManager from "./DragManager";
export const DragDropDiv = (props) => {
    const { getRef, onDragStartT, onDragMoveT, onDragEndT, onDragOverT, onDragLeaveT, onDropT, children, className } = props, others = __rest(props, ["getRef", "onDragStartT", "onDragMoveT", "onDragEndT", "onDragOverT", "onDragLeaveT", "onDropT", "children", "className"]);
    const [element, setElement] = React.useState(null);
    const [ownerDocument, setOwnerDocument] = React.useState(null);
    const [event, setEvent] = React.useState(null);
    const dragComponent = React.useRef(null);
    const listening = React.useRef(false);
    const waitingMove = React.useRef(false);
    const ref = React.useCallback((_ref) => {
        setOwnerDocument(_ref.ownerDocument);
        getRef === null || getRef === void 0 ? void 0 : getRef(_ref);
        setElement(_ref);
    }, [getRef]);
    React.useEffect(() => {
        if (element) {
            if (onDragOverT) {
                DragManager.addHandlers(element, { onDragLeaveT, onDragOverT, onDropT });
            }
            else {
                DragManager.removeHandlers(element);
            }
        }
        return () => {
            if (element) {
                DragManager.removeHandlers(element);
            }
        };
    }, [element, onDragLeaveT, onDragOverT, onDropT]);
    const onPointerDown = React.useCallback((e) => {
        let nativeTarget = e.nativeEvent.target;
        if (nativeTarget instanceof HTMLInputElement ||
            nativeTarget instanceof HTMLTextAreaElement ||
            nativeTarget.classList.contains("drag-ignore")) {
            // ignore drag from input element
            return;
        }
        setEvent(e.nativeEvent);
    }, []);
    React.useEffect(() => {
        if (DragManager.isDragging()) {
            // same pointer event shouldn't trigger 2 drag start
            return;
        }
        if (!element || !ownerDocument) {
            return;
        }
        const onMouseMove = (e) => {
            console.log("mousemove", e);
        };
        const onMouseUp = (e) => {
            console.log("mouseup", e);
        };
        let state = new DragManager.DragState(event, this, true);
        let baseX = state.pageX;
        let baseY = state.pageY;
        let baseElement = element.parentElement;
        let rect = baseElement.getBoundingClientRect();
        let scaleX = baseElement.offsetWidth / Math.round(rect.width);
        let scaleY = baseElement.offsetHeight / Math.round(rect.height);
        let dragType;
        ownerDocument.addEventListener("mousemove", onMouseMove);
        ownerDocument.addEventListener("mouseup", onMouseUp);
        if (event.button === 2) {
            dragType = "right";
        }
        else {
            dragType = "left";
        }
        waitingMove.current = true;
        listening.current = true;
        return () => {
            ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.removeEventListener("mousemove", onMouseMove);
            ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.removeEventListener("mouseup", onMouseUp);
        };
    }, [event, element, ownerDocument]);
    let onMouseDown;
    let _className = className;
    if (onDragStartT) {
        onMouseDown = onPointerDown;
        if (_className) {
            _className = `${_className} drag-initiator`;
        }
        else {
            _className = "drag-initiator";
        }
    }
    return (React.createElement("div", Object.assign({ ref: ref, className: _className }, others, { onMouseDown: onMouseDown }), children));
};
