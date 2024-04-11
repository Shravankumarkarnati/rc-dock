import * as React from "react";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import { DragState } from "./dragdrop/DragManager";

export interface DividerChild {
  size: number;
  minSize?: number;
}

export interface DividerData {
  element: HTMLElement;
  beforeDivider: DividerChild[];
  afterDivider: DividerChild[];
}

interface DividerProps {
  idx: number;
  className?: string;
  isVertical?: boolean;

  getDividerData(idx: number): DividerData;

  changeSizes(sizes: number[]): void;

  onDragEnd?(): void;
}

class BoxDataCache implements DividerData {
  element: HTMLElement;
  beforeDivider: DividerChild[];
  afterDivider: DividerChild[];

  beforeSize = 0;
  beforeMinSize = 0;
  afterSize = 0;
  afterMinSize = 0;

  constructor(data: DividerData) {
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
function spiltSize(
  newSize: number,
  oldSize: number,
  children: DividerChild[]
): number[] {
  let reservedSize = -1;
  let sizes: number[] = [];
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

export const Divider = ({
  changeSizes,
  getDividerData,
  idx,
  className,
  isVertical,
  onDragEnd,
}: DividerProps) => {
  const [boxData, setBoxData] = React.useState<BoxDataCache | null>(null);

  const startDrag = React.useCallback(
    (e: DragState) => {
      const _boxData = new BoxDataCache(getDividerData(idx));
      e.startDrag(_boxData.element, null);
      setBoxData(_boxData);
    },
    [getDividerData, idx]
  );

  const dragMove2 = React.useCallback(
    (e: DragState, dx: number, dy: number) => {
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
      } else if (leftSize < leftChild.minSize) {
        leftSize = leftChild.minSize;
        rightSize = leftChild.size + rightChild.size - leftSize;
      }
      let sizes = beforeDivider.concat(afterDivider).map((child) => child.size);
      sizes[beforeDivider.length - 1] = leftSize;
      sizes[beforeDivider.length] = rightSize;
      changeSizes(sizes);
    },
    [isVertical, changeSizes, boxData]
  );

  const dragMoveAll = React.useCallback(
    (e: DragState, dx: number, dy: number) => {
      let {
        beforeSize,
        beforeMinSize,
        afterSize,
        afterMinSize,
        beforeDivider,
        afterDivider,
      } = boxData;
      let d = isVertical ? dy : dx;
      let newBeforeSize = beforeSize + d;
      let newAfterSize = afterSize - d;
      // check total min size
      if (d > 0) {
        if (newAfterSize < afterMinSize) {
          newAfterSize = afterMinSize;
          newBeforeSize = beforeSize + afterSize - afterMinSize;
        }
      } else if (newBeforeSize < beforeMinSize) {
        newBeforeSize = beforeMinSize;
        newAfterSize = beforeSize + afterSize - beforeMinSize;
      }

      changeSizes(
        spiltSize(newBeforeSize, beforeSize, beforeDivider).concat(
          spiltSize(newAfterSize, afterSize, afterDivider)
        )
      );
    },
    [isVertical, changeSizes, boxData]
  );

  const dragMove = React.useCallback(
    (e: DragState) => {
      if (e.event.shiftKey || e.event.ctrlKey || e.event.altKey) {
        dragMoveAll(e, e.dx, e.dy);
      } else {
        dragMove2(e, e.dx, e.dy);
      }
    },
    [dragMoveAll, dragMove2]
  );

  const dragEnd = React.useCallback(
    (e: DragState) => {
      setBoxData(null);
      if (onDragEnd) {
        onDragEnd();
      }
    },
    [onDragEnd]
  );

  if (!className) {
    className = "dock-divider";
  }

  return (
    <DragDropDiv
      className={className}
      onDragStartT={startDrag}
      onDragMoveT={dragMove}
      onDragEndT={dragEnd}
    />
  );
};
