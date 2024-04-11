import * as React from "react";
import { DropDirection, PanelData } from "./DockData";
interface DockDropSquareProps {
    direction: DropDirection;
    depth?: number;
    panelData: PanelData;
    panelElement: HTMLElement;
}
export declare const DockDropSquare: ({ panelElement, direction, depth, panelData, }: DockDropSquareProps) => React.JSX.Element;
interface DockDropLayerProps {
    panelData: PanelData;
    panelElement: HTMLElement;
    dropFromPanel: PanelData;
}
export declare const DockDropLayer: ({ panelData, panelElement, dropFromPanel }: DockDropLayerProps) => React.JSX.Element;
export {};
