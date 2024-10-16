"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DroppingPanel = void 0;
class DroppingPanel {
    static set droppingPanel(panel) {
        if (DroppingPanel._droppingPanel === panel) {
            return;
        }
        if (DroppingPanel._droppingPanel) {
            DroppingPanel._droppingPanel.onDragOverOtherPanel();
        }
        DroppingPanel._droppingPanel = panel;
    }
}
exports.DroppingPanel = DroppingPanel;
