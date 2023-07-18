import { memo, useCallback, useRef } from "react";
import NewWindow from "rc-new-window";
import { PanelData } from "./DockData";
import { DockPanel } from "./DockPanel";
import {
  mapElementToScreenRect,
  mapWindowToElement,
} from "rc-new-window/lib/ScreenPosition";
import React from "react";
import { useDockContext } from "./DockContext";

// This file passes the vibe check

interface Props {
  panelData: PanelData;
}

export const WindowPanel: React.FC<Props> = memo(({ panelData }) => {
  const context = useDockContext();
  const window = useRef<Window>();

  const onOpen = useCallback(
    (w: Window) => {
      if (!window.current && w) {
        window.current = w;
      }
    },
    [window]
  );

  const onUnload = useCallback(() => {
    let layoutRoot = context.getRootElement();
    const rect = mapWindowToElement(layoutRoot, window.current);

    if (rect.width > 0 && rect.height > 0) {
      panelData.x = rect.left;
      panelData.y = rect.top;
      panelData.w = rect.width;
      panelData.h = rect.height;
    }

    context.dockMove(panelData, null, "float");
  }, [context, window, panelData]);

  const initPopupInnerRect = useCallback(
    () =>
      mapElementToScreenRect(context.getRootElement(), {
        left: panelData.x,
        top: panelData.y,
        width: panelData.w,
        height: panelData.h,
      }) as any,
    [context, panelData]
  );

  return (
    <NewWindow
      copyStyles
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
