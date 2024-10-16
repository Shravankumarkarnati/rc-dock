export type DroppingPanelState = {
  onDragOverOtherPanel: () => void;
};

export class DroppingPanel {
  static _droppingPanel: DroppingPanelState;
  static set droppingPanel(panel: DroppingPanelState) {
    if (DroppingPanel._droppingPanel === panel) {
      return;
    }
    if (DroppingPanel._droppingPanel) {
      DroppingPanel._droppingPanel.onDragOverOtherPanel();
    }
    DroppingPanel._droppingPanel = panel;
  }
}
