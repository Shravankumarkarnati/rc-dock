import * as React from "react";
import { DockContext, DropDirection, PanelData, TabData } from "./DockData";
import { Tab } from "./DockTabPane";
import * as DragManager from "./dragdrop/DragManager";
export declare class TabCache {
    _ref: HTMLDivElement;
    getRef: (r: HTMLDivElement) => void;
    _hitAreaRef: HTMLDivElement;
    getHitAreaRef: (r: HTMLDivElement) => void;
    data: TabData;
    context: DockContext;
    content: Tab;
    constructor(context: DockContext);
    setData(data: TabData): boolean;
    onCloseClick: (e: React.MouseEvent) => void;
    onDragStart: (e: DragManager.DragState) => void;
    onDragOver: (e: DragManager.DragState) => void;
    onDragLeave: (e: DragManager.DragState) => void;
    onDrop: (e: DragManager.DragState) => void;
    getDropDirection(e: DragManager.DragState): DropDirection;
    render(): Tab;
    destroy(): void;
}
interface Props {
    panelData: PanelData;
    onPanelDragStart: DragManager.DragHandler;
    onPanelDragMove: DragManager.DragHandler;
    onPanelDragEnd: DragManager.DragHandler;
}
export declare const DockTabs: ({ panelData, onPanelDragEnd, onPanelDragMove, onPanelDragStart, }: Props) => React.JSX.Element;
export {};
