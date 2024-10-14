"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debounce_1 = __importDefault(require("lodash/debounce"));
const react_1 = __importStar(require("react"));
const react_dom_1 = require("react-dom");
const BrowserPopupWindow_1 = require("./BrowserPopupWindow");
/**
 * The NewWindow class object.
 * @public
 */
const NewWindow = ({ children, copyStyles: shouldCopyStyles = true, height = 480, initPopupInnerRect, initPopupOuterRect, name = "", onBlock, onClose, onOpen, title, url = "", width = 640, }) => {
    const [portalContainer, setPortalContainer] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const container = document.createElement("div");
        const window = globalThis.window;
        let features = { width, height };
        if (initPopupOuterRect) {
            features = initPopupOuterRect();
            const [topBorder, sideBorder, bottomBorder] = BrowserPopupWindow_1.BrowserPopupWindow.popupWindowBorder;
            if (!BrowserPopupWindow_1.BrowserPopupWindow.isSafari) {
                features.width -= sideBorder * 2;
                features.height -= topBorder + bottomBorder;
            }
        }
        else if (initPopupInnerRect) {
            features = initPopupInnerRect();
            const [topBorder, sideBorder] = BrowserPopupWindow_1.BrowserPopupWindow.popupWindowBorder;
            features.left -= sideBorder;
            features.top -= topBorder;
            if (BrowserPopupWindow_1.BrowserPopupWindow.isSafari) {
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
        const onNewWindowResize = (0, debounce_1.default)(() => {
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
        return (0, react_dom_1.createPortal)(children, portalContainer);
    }
    return react_1.default.createElement(react_1.default.Fragment, null);
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
exports.default = NewWindow;
__exportStar(require("./ScreenPosition"), exports);
__exportStar(require("./BrowserPopupWindow"), exports);
