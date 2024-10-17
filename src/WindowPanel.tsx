import NewWindow from "rc-new-window";
import {
  mapElementToScreenRect,
  mapWindowToElement,
} from "rc-new-window/lib/ScreenPosition";
import * as React from "react";
import { PanelData, useDockContext } from "./DockData";
import { DockPanel } from "./DockPanel";

interface Props {
  readonly panelData: PanelData;
}

export const WindowPanel = React.memo(function WindowPanelBase({
  panelData,
}: Props) {
  const context = useDockContext();

  const _window = React.useRef<Window | null>(null);

  const onOpen = React.useCallback((_w: Window) => {
    if (!_window.current && _w) {
      _window.current = _w;
    }
  }, []);

  const onUnload = React.useCallback(() => {
    const layoutRoot = context.getRootElement();
    const rect = mapWindowToElement(layoutRoot, _window.current);
    if (rect.width > 0 && rect.height > 0) {
      panelData.x = rect.left;
      panelData.y = rect.top;
      panelData.w = rect.width;
      panelData.h = rect.height;
    }
    context.dockMove(panelData, null, "float");
  }, [panelData, context]);

  const initPopupInnerRect = React.useCallback(() => {
    return mapElementToScreenRect(context.getRootElement(), {
      left: panelData.x,
      top: panelData.y,
      width: panelData.w,
      height: panelData.h,
    });
  }, [context, panelData]);

  return (
    <NewWindow
      copyStyles={true}
      onOpen={onOpen}
      onClose={onUnload}
      onBlock={onUnload}
      initPopupInnerRect={initPopupInnerRect}
      width={panelData.w}
      height={panelData.h}
    >
      <div className="dock-wbox">
        <DockPanel
          size={panelData.size}
          panelData={panelData}
          key={panelData.id}
        />
      </div>
    </NewWindow>
  );
});
