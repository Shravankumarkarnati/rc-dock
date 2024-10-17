import * as React from "react";
import { DockContext, DropDirection, PanelData, TabData } from "./DockData";
import * as DragManager from "./dragdrop/DragManager";
export declare class TabCache {
    _ref: HTMLDivElement;
    getRef: (r: HTMLDivElement) => void;
    _hitAreaRef: HTMLDivElement;
    getHitAreaRef: (r: HTMLDivElement) => void;
    data: TabData;
    context: DockContext;
    content: React.ReactElement;
    label: React.ReactNode;
    constructor(context: DockContext);
    setData(data: TabData): boolean;
    onCloseClick: (e: React.MouseEvent) => void;
    onDragStart: (e: DragManager.DragState) => void;
    onDragOver: (e: DragManager.DragState) => void;
    onDragLeave: (e: DragManager.DragState) => void;
    onDrop: (e: DragManager.DragState) => void;
    getDropDirection(e: DragManager.DragState): DropDirection;
    render(): JSX.Element[];
    destroy(): void;
}
interface Props {
    panelData: PanelData;
    onPanelDragStart: DragManager.DragHandler;
    onPanelDragMove: DragManager.DragHandler;
    onPanelDragEnd: DragManager.DragHandler;
}
export declare const DockTabs: React.NamedExoticComponent<Props>;
export {};
