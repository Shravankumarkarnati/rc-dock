import * as React from "react";
import { PanelData } from "./DockData";
import * as DragManager from "./dragdrop/DragManager";
interface Props {
    panelData: PanelData;
    onPanelDragStart: DragManager.DragHandler;
    onPanelDragMove: DragManager.DragHandler;
    onPanelDragEnd: DragManager.DragHandler;
}
export declare const DockTabs: React.NamedExoticComponent<Props>;
export {};
