import { getParser } from "bowser"

export class BrowserPopupWindow {
  private static browser =
    typeof globalThis.window === "object" ? getParser(globalThis.window.navigator.userAgent) : null

  private static get windowBorder(): [number, number, number] {
    switch (BrowserPopupWindow.browser?.getOSName(true)) {
      case "windows": {
        let result: [number, number, number]
        switch (BrowserPopupWindow.browser.getBrowserName(true)) {
          case "firefox":
            result = [68, 8, 8]
            break
          case "microsoft edge":
            result = [62, 8, 8]
            break
          //case 'chrome':
          default:
            result = [60, 8, 8]
        }
        if (window.devicePixelRatio > 1) {
          result[0] -= 2
          result[1] -= 1
          result[2] -= 1
        }
        return result
      }
      case "macos": {
        switch (BrowserPopupWindow.browser.getBrowserName(true)) {
          case "safari":
            return [22, 0, 0]
          case "firefox":
            return [59, 0, 0]
          //case 'chrome':
          default:
            return [51, 0, 0]
        }
      }
    }
    return [60, 8, 8]
  }

  public static isSafari = BrowserPopupWindow.browser?.getBrowserName(true) === "safari"
  public static popupSupported = BrowserPopupWindow.browser?.getPlatformType() === "desktop"
  public static popupWindowBorder = this.windowBorder
}
