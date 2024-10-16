export declare type DroppingPanelState = {
    onDragOverOtherPanel: () => void;
};
export declare class DroppingPanel {
    static _droppingPanel: DroppingPanelState;
    static set droppingPanel(panel: DroppingPanelState);
}
