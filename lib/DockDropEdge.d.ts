import * as React from "react";
import { PanelData } from "./DockData";
interface DockDropEdgeProps {
    panelData: PanelData;
    panelElement: HTMLElement;
    dropFromPanel: PanelData;
}
export declare const DockDropEdge: ({ panelData, panelElement, dropFromPanel }: DockDropEdgeProps) => React.JSX.Element;
export {};
