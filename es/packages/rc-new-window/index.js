import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrowserPopupWindow } from "./BrowserPopupWindow";
/**
 * The NewWindow class object.
 * @public
 */
const NewWindow = ({ children, copyStyles: shouldCopyStyles = true, height = 480, initPopupInnerRect, initPopupOuterRect, name = "", onBlock, onClose, onOpen, title, url = "", width = 640, }) => {
    const [portalContainer, setPortalContainer] = useState(null);
    useEffect(() => {
        const container = document.createElement("div");
        const window = globalThis.window;
        let features = { width, height };
        if (initPopupOuterRect) {
            features = initPopupOuterRect();
            const [topBorder, sideBorder, bottomBorder] = BrowserPopupWindow.popupWindowBorder;
            if (!BrowserPopupWindow.isSafari) {
                features.width -= sideBorder * 2;
                features.height -= topBorder + bottomBorder;
            }
        }
        else if (initPopupInnerRect) {
            features = initPopupInnerRect();
            const [topBorder, sideBorder] = BrowserPopupWindow.popupWindowBorder;
            features.left -= sideBorder;
            features.top -= topBorder;
            if (BrowserPopupWindow.isSafari) {
                features.height += topBorder;
            }
        }
        else {
            features.left = window.top.outerWidth / 2 + window.top.screenX - width / 2;
            features.top = window.top.outerHeight / 2 + window.top.screenY - height / 2;
        }
        // Open a new window.
        let newWindow = window.open(url, name, toWindowFeatures(features));
        // Check if the new window was successfully opened.
        if (newWindow) {
            newWindow.document.title = title || document.title;
            newWindow.document.body.appendChild(container);
            // If specified, copy styles from parent window's document.
            if (shouldCopyStyles) {
                copyStyles(document, newWindow.document);
            }
            onOpen === null || onOpen === void 0 ? void 0 : onOpen(newWindow);
        }
        else {
            // Handle error on opening of new window.
            if (typeof onBlock === "function") {
                onBlock();
            }
            else {
                console.warn("A new window could not be opened. Maybe it was blocked.");
            }
        }
        const onNewWindowResize = debounce(() => {
            // add/remove element on main document, force it to dispatch resize observer event on the popup window
            let div = document.createElement("div");
            document.body.append(div);
            div.remove();
            // TODO update resize event
        }, 200);
        let hasOnLoaded = false;
        const onUnload = () => {
            if (!hasOnLoaded) {
                hasOnLoaded = true;
                newWindow.close();
                onClose === null || onClose === void 0 ? void 0 : onClose(newWindow);
            }
        };
        window.addEventListener("beforeunload", onUnload);
        newWindow.addEventListener("beforeunload", onUnload);
        newWindow.addEventListener("resize", onNewWindowResize);
        setPortalContainer(container);
        return () => {
            onNewWindowResize.cancel();
            window.removeEventListener("beforeunload", onUnload);
            newWindow.removeEventListener("beforeunload", onUnload);
            newWindow.removeEventListener("resize", onNewWindowResize);
            setPortalContainer(null);
        };
    }, [
        children,
        height,
        initPopupInnerRect,
        initPopupOuterRect,
        name,
        onBlock,
        onClose,
        onOpen,
        shouldCopyStyles,
        title,
        url,
        width,
    ]);
    if (portalContainer) {
        return createPortal(children, portalContainer);
    }
    return React.createElement(React.Fragment, null);
};
/**
 * Utility functions.
 * @private
 */
/**
 * Copy styles from a source document to a target.
 * @param {Object} source
 * @param {Object} target
 * @private
 */
function copyStyles(source, target) {
    Array.from(source.styleSheets).forEach((styleSheet) => {
        // For <style> elements
        let rules;
        if (styleSheet.href) {
            // for <link> elements loading CSS from a URL
            const newLinkEl = source.createElement("link");
            newLinkEl.rel = "stylesheet";
            newLinkEl.href = styleSheet.href;
            target.head.appendChild(newLinkEl);
        }
        else {
            try {
                rules = styleSheet.cssRules;
            }
            catch (err) {
                // can't access crossdomain rules
            }
            if (rules) {
                const newStyleEl = source.createElement("style");
                // Write the text of each rule into the body of the style element
                Array.from(styleSheet.cssRules).forEach((cssRule) => {
                    const { cssText, type } = cssRule;
                    let returnText = cssText;
                    // Check if the cssRule type is CSSImportRule (3) or CSSFontFaceRule (5) to handle local imports on a about:blank page
                    // '/custom.css' turns to 'http://my-site.com/custom.css'
                    if ([3, 5].includes(type)) {
                        returnText = cssText
                            .split("url(")
                            .map((line) => {
                            if (line[1] === "/") {
                                return `${line.slice(0, 1)}${window.location.origin}${line.slice(1)}`;
                            }
                            return line;
                        })
                            .join("url(");
                    }
                    newStyleEl.appendChild(source.createTextNode(returnText));
                });
                target.head.appendChild(newStyleEl);
            }
        }
    });
}
/**
 * Convert features props to window features format (name=value,other=value).
 * @param {Object} obj
 * @return {String}
 * @private
 */
function toWindowFeatures(obj) {
    return Object.keys(obj)
        .reduce((features, name) => {
        const value = obj[name];
        if (typeof value === "boolean") {
            features.push(`${name}=${value ? "yes" : "no"}`);
        }
        else {
            features.push(`${name}=${value}`);
        }
        return features;
    }, [])
        .join(",");
}
/**
 * Component export.
 * @private
 */
export default NewWindow;
export * from "./ScreenPosition";
export * from "./BrowserPopupWindow";
