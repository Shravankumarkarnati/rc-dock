import * as React from "react";
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
export declare const Divider: React.NamedExoticComponent<DividerProps>;
export {};
