import * as React from "react";
import * as DragManager from "./DragManager";
export type AbstractPointerEvent = MouseEvent;
interface DragDropDivProps extends React.HTMLAttributes<HTMLDivElement> {
    getRef?: (ref: HTMLDivElement) => void;
    onDragStartT?: DragManager.DragHandler;
    onDragMoveT?: DragManager.DragHandler;
    onDragEndT?: DragManager.DragHandler;
    onDragOverT?: DragManager.DragHandler;
    onDragLeaveT?: DragManager.DragHandler;
    /**
     * Anything returned by onDropT will be stored in DragState.dropped
     * return false to indicate the drop is canceled
     */
    onDropT?: DragManager.DropHandler;
}
export declare const DragDropDiv: (props: DragDropDivProps) => React.JSX.Element;
export {};
