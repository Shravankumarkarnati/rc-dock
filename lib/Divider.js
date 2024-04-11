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
exports.Divider = void 0;
const React = __importStar(require("react"));
const DragDropDiv_1 = require("./dragdrop/DragDropDiv");
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
const Divider = ({ changeSizes, getDividerData, idx, className, isVertical, onDragEnd, }) => {
    const [boxData, setBoxData] = React.useState(null);
    const startDrag = React.useCallback((e) => {
        const _boxData = new BoxDataCache(getDividerData(idx));
        e.startDrag(_boxData.element, null);
        setBoxData(_boxData);
    }, [getDividerData, idx]);
    const dragMove2 = React.useCallback((e, dx, dy) => {
        let { beforeDivider, afterDivider } = boxData;
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
    }, [isVertical, changeSizes, boxData]);
    const dragMoveAll = React.useCallback((e, dx, dy) => {
        let { beforeSize, beforeMinSize, afterSize, afterMinSize, beforeDivider, afterDivider } = boxData;
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
    }, [isVertical, changeSizes, boxData]);
    const dragMove = React.useCallback((e) => {
        if (e.event.shiftKey || e.event.ctrlKey || e.event.altKey) {
            dragMoveAll(e, e.dx, e.dy);
        }
        else {
            dragMove2(e, e.dx, e.dy);
        }
    }, [dragMoveAll, dragMove2]);
    const dragEnd = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e) => {
        setBoxData(null);
        if (onDragEnd) {
            onDragEnd();
        }
    }, [onDragEnd]);
    if (!className) {
        className = "dock-divider";
    }
    return (React.createElement(DragDropDiv_1.DragDropDiv, { className: className, onDragStartT: startDrag, onDragMoveT: dragMove, onDragEndT: dragEnd }));
};
exports.Divider = Divider;
