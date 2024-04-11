import * as React from "react";
import { BoxData } from "./DockData";
interface Props {
    boxData: BoxData;
}
export declare const WindowBox: ({ boxData: { children } }: Props) => React.JSX.Element;
export declare const isWindowBoxEnabled: () => boolean;
export {};
