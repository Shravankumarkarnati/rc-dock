import * as React from "react";
import { DropDirection, PanelData } from "./DockData";
interface DockDropSquareProps {
    direction: DropDirection;
    depth?: number;
    panelData: PanelData;
    panelElement: HTMLElement;
}
export declare const DockDropSquare: React.NamedExoticComponent<DockDropSquareProps>;
interface DockDropLayerProps {
    panelData: PanelData;
    panelElement: HTMLElement;
    dropFromPanel: PanelData;
}
export declare const DockDropLayer: React.NamedExoticComponent<DockDropLayerProps>;
export {};
