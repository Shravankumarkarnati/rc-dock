import React from "react";
interface Feature {
    width?: number;
    height?: number;
    left?: number;
    top?: number;
}
interface Props {
    children?: React.ReactNode;
    url?: string;
    name?: string;
    title?: string;
    width?: number;
    height?: number;
    initPopupInnerRect?: () => Feature;
    initPopupOuterRect?: () => Feature;
    onOpen?: (w: Window) => void;
    onClose?: (w: Window) => void;
    onBlock?: () => void;
    copyStyles?: boolean;
}
/**
 * The NewWindow class object.
 * @public
 */
declare const NewWindow: ({ children, copyStyles: shouldCopyStyles, height, initPopupInnerRect, initPopupOuterRect, name, onBlock, onClose, onOpen, title, url, width, }: Props) => React.JSX.Element;
/**
 * Component export.
 * @private
 */
export default NewWindow;
export * from "./ScreenPosition";
export * from "./BrowserPopupWindow";
