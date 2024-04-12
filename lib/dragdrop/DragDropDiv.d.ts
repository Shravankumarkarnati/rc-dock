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
    /**
     * by default onDragStartT will be called on first drag move
     * but if directDragT is true, onDragStartT will be called as soon as mouse is down
     */
    directDragT?: boolean;
    useRightButtonDragT?: boolean;
}
export declare class DragDropDiv extends React.PureComponent<DragDropDivProps, any> {
    element: HTMLElement;
    ownerDocument: Document;
    _getRef: (r: HTMLDivElement) => void;
    dragType: DragManager.DragType;
    baseX: number;
    baseY: number;
    scaleX: number;
    scaleY: number;
    waitingMove: boolean;
    listening: boolean;
    baseX2: number;
    baseY2: number;
    baseDis: number;
    baseAng: number;
    onPointerDown: (e: React.MouseEvent) => void;
    onDragStart(event: AbstractPointerEvent): void;
    addDragListeners(event: AbstractPointerEvent): void;
    checkFirstMove(e: AbstractPointerEvent): boolean;
    executeFirstMove(state: DragManager.DragState): boolean;
    onMouseMove: (e: MouseEvent) => void;
    onDragEnd: (e?: MouseEvent) => void;
    onKeyDown: (e: KeyboardEvent) => void;
    cancel(): void;
    removeListeners(): void;
    cleanupDrag(state: DragManager.DragState): void;
    render(): React.ReactNode;
    componentDidUpdate(prevProps: DragDropDivProps): void;
    componentWillUnmount(): void;
}
export {};
