import * as React from "react";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
class BoxDataCache {
    constructor(data) {
        this.beforeSize = 0;
        this.beforeMinSize = 0;
        this.afterSize = 0;
        this.afterMinSize = 0;
        this.element = data.element;
        this.beforeDivider = data.beforeDivider;
        this.afterDivider = data.afterDivider;
        for (let child of this.beforeDivider) {
            this.beforeSize += child.size;
            if (child.minSize > 0) {
                this.beforeMinSize += child.minSize;
            }
        }
        for (let child of this.afterDivider) {
            this.afterSize += child.size;
            if (child.minSize > 0) {
                this.afterMinSize += child.minSize;
            }
        }
    }
}
// split size among children
function spiltSize(newSize, oldSize, children) {
    let reservedSize = -1;
    let sizes = [];
    let requiredMinSize = 0;
    while (requiredMinSize !== reservedSize) {
        reservedSize = requiredMinSize;
        requiredMinSize = 0;
        let ratio = (newSize - reservedSize) / (oldSize - reservedSize);
        if (!(ratio >= 0)) {
            // invalid input
            break;
        }
        for (let i = 0; i < children.length; ++i) {
            let size = children[i].size * ratio;
            if (size < children[i].minSize) {
                size = children[i].minSize;
                requiredMinSize += size;
            }
            sizes[i] = size;
        }
    }
    return sizes;
}
export const Divider = React.memo(function DividerBase(props) {
    const boxData = React.useRef(null);
    let { className, onDragEnd, isVertical, changeSizes, getDividerData, idx } = props;
    const dragMoveAll = React.useCallback((dx, dy) => {
        if (!boxData.current)
            return;
        let { beforeSize, beforeMinSize, afterSize, afterMinSize, beforeDivider, afterDivider, } = boxData.current;
        let d = isVertical ? dy : dx;
        let newBeforeSize = beforeSize + d;
        let newAfterSize = afterSize - d;
        // check total min size
        if (d > 0) {
            if (newAfterSize < afterMinSize) {
                newAfterSize = afterMinSize;
                newBeforeSize = beforeSize + afterSize - afterMinSize;
            }
        }
        else if (newBeforeSize < beforeMinSize) {
            newBeforeSize = beforeMinSize;
            newAfterSize = beforeSize + afterSize - beforeMinSize;
        }
        changeSizes(spiltSize(newBeforeSize, beforeSize, beforeDivider).concat(spiltSize(newAfterSize, afterSize, afterDivider)));
    }, [isVertical, changeSizes]);
    const dragMove2 = React.useCallback((dx, dy) => {
        if (!boxData.current)
            return;
        let { beforeDivider, afterDivider } = boxData.current;
        if (!(beforeDivider.length && afterDivider.length)) {
            // invalid input
            return;
        }
        let d = isVertical ? dy : dx;
        let leftChild = beforeDivider.at(-1);
        let rightChild = afterDivider[0];
        let leftSize = leftChild.size + d;
        let rightSize = rightChild.size - d;
        // check min size
        if (d > 0) {
            if (rightSize < rightChild.minSize) {
                rightSize = rightChild.minSize;
                leftSize = leftChild.size + rightChild.size - rightSize;
            }
        }
        else if (leftSize < leftChild.minSize) {
            leftSize = leftChild.minSize;
            rightSize = leftChild.size + rightChild.size - leftSize;
        }
        let sizes = beforeDivider.concat(afterDivider).map((child) => child.size);
        sizes[beforeDivider.length - 1] = leftSize;
        sizes[beforeDivider.length] = rightSize;
        changeSizes(sizes);
    }, [isVertical, changeSizes]);
    const dragMove = React.useCallback((e) => {
        if (e.event.shiftKey || e.event.ctrlKey || e.event.altKey) {
            dragMoveAll(e.dx, e.dy);
        }
        else {
            dragMove2(e.dx, e.dy);
        }
    }, [dragMoveAll, dragMove2]);
    const dragEnd = React.useCallback((e) => {
        boxData.current = null;
        onDragEnd === null || onDragEnd === void 0 ? void 0 : onDragEnd();
    }, [onDragEnd]);
    const startDrag = React.useCallback((e) => {
        boxData.current = new BoxDataCache(getDividerData(idx));
        e.startDrag(boxData.current.element, null);
    }, [getDividerData, idx]);
    if (!className) {
        className = "dock-divider";
    }
    return (React.createElement(DragDropDiv, { className: className, onDragStartT: startDrag, onDragMoveT: dragMove, onDragEndT: dragEnd }));
});
