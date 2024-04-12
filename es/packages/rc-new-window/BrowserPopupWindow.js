var _a, _b;
var _c;
import { getParser } from "bowser";
export class BrowserPopupWindow {
    static get windowBorder() {
        var _a;
        switch ((_a = _c.browser) === null || _a === void 0 ? void 0 : _a.getOSName(true)) {
            case "windows": {
                let result;
                switch (_c.browser.getBrowserName(true)) {
                    case "firefox":
                        result = [68, 8, 8];
                        break;
                    case "microsoft edge":
                        result = [62, 8, 8];
                        break;
                    //case 'chrome':
                    default:
                        result = [60, 8, 8];
                }
                if (window.devicePixelRatio > 1) {
                    result[0] -= 2;
                    result[1] -= 1;
                    result[2] -= 1;
                }
                return result;
            }
            case "macos": {
                switch (_c.browser.getBrowserName(true)) {
                    case "safari":
                        return [22, 0, 0];
                    case "firefox":
                        return [59, 0, 0];
                    //case 'chrome':
                    default:
                        return [51, 0, 0];
                }
            }
        }
        return [60, 8, 8];
    }
}
_c = BrowserPopupWindow;
BrowserPopupWindow.browser = typeof globalThis.window === "object" ? getParser(globalThis.window.navigator.userAgent) : null;
BrowserPopupWindow.isSafari = ((_a = _c.browser) === null || _a === void 0 ? void 0 : _a.getBrowserName(true)) === "safari";
BrowserPopupWindow.popupSupported = ((_b = _c.browser) === null || _b === void 0 ? void 0 : _b.getPlatformType()) === "desktop";
BrowserPopupWindow.popupWindowBorder = _c.windowBorder;
