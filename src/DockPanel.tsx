import classNames from "classnames";
import * as React from "react";
import { getFloatPanelSize, nextZIndex } from "./Algorithm";
import { PanelData, TabData, useDockContext } from "./DockData";
import { DockDropEdge } from "./DockDropEdge";
import { DockDropLayer } from "./DockDropLayer";
import { DockTabs } from "./DockTabs";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import { DragState } from "./dragdrop/DragManager";
import { DroppingPanel, DroppingPanelState } from "./DroppingPanel";
import { useForceUpdate } from "./UseForceUpdate";
import { groupClassNames } from "./Utils";

interface Props {
  panelData: PanelData;
  size: number;
}

interface State {
  dropFromPanel: PanelData;
  draggingHeader: boolean;
}

export const DockPanel = React.memo(function DockPanelBase(props: Props) {
  const context = useDockContext();
  const forceUpdate = useForceUpdate();

  const [_ref, setRef] = React.useState<HTMLElement | null>(null);

  const [state, setState] = React.useState<State>({
    dropFromPanel: null,
    draggingHeader: false,
  });

  const droppingPanelState: DroppingPanelState = React.useMemo(
    () => ({
      onDragOverOtherPanel: () => {
        setState((prev) => ({ ...prev, dropFromPanel: null }));
      },
    }),
    []
  );

  let dockId = context.getDockId();
  let { dropFromPanel, draggingHeader } = state;
  let { panelData, size } = props;
  let { minWidth, minHeight, group, id, parent, panelLock } = panelData;

  const onDragOver = React.useCallback(
    (e: DragState) => {
      if (DroppingPanel._droppingPanel === droppingPanelState) {
        return;
      }
      let tab: TabData = DragState.getData("tab", dockId);
      let panel: PanelData = DragState.getData("panel", dockId);
      if (tab || panel) {
        DroppingPanel.droppingPanel = droppingPanelState;
      }
      if (tab) {
        if (tab.parent) {
          setState((prev) => ({ ...prev, dropFromPanel: tab.parent }));
        } else {
          // add a fake panel
          setState((prev) => ({
            ...prev,
            dropFromPanel: { activeId: "", tabs: [], group: tab.group },
          }));
        }
      } else if (panel) {
        setState((prev) => ({
          ...prev,
          dropFromPanel: panel,
        }));
      }
    },
    [droppingPanelState, dockId]
  );

  const onFloatPointerDown = React.useCallback(() => {
    let { z } = panelData;
    let newZ = nextZIndex(z);
    if (newZ !== z) {
      panelData.z = newZ;
      forceUpdate();
    }
  }, [panelData, forceUpdate]);

  // used both by dragging head and corner
  const movingState = React.useRef<
    Partial<{
      _movingX: number;
      _movingY: number;
      _movingW: number;
      _movingH: number;
      _movingCorner: string;
    }>
  >({});
  // drop to move in float mode
  const onPanelHeaderDragStart = React.useCallback(
    (event: DragState) => {
      let { parent, x, y, z } = panelData;
      if (parent?.mode === "float") {
        movingState.current._movingX = x;
        movingState.current._movingY = y;
        // hide the panel, but not create drag layer element
        event.setData({ panel: panelData, tabGroup: panelData.group }, dockId);
        event.startDrag(null, null);
        onFloatPointerDown();
      } else {
        let tabGroup = context.getGroup(panelData.group);
        let [panelWidth, panelHeight] = getFloatPanelSize(_ref, tabGroup);

        event.setData(
          {
            panel: panelData,
            panelSize: [panelWidth, panelHeight],
            tabGroup: panelData.group,
          },
          dockId
        );
        event.startDrag(null);
      }
      setState((prev) => ({ ...prev, draggingHeader: true }));
    },
    [panelData, dockId, onFloatPointerDown, context, _ref]
  );

  const onPanelHeaderDragMove = React.useCallback(
    (e: DragState) => {
      if (panelData.parent?.mode !== "float") {
        return;
      }
      let { width, height } = context.getLayoutSize();
      panelData.x = movingState.current._movingX + e.dx;
      panelData.y = movingState.current._movingY + e.dy;
      if (width > 200 && height > 200) {
        if (panelData.y < 0) {
          panelData.y = 0;
        } else if (panelData.y > height - 16) {
          panelData.y = height - 16;
        }

        if (panelData.x + panelData.w < 16) {
          panelData.x = 16 - panelData.w;
        } else if (panelData.x > width - 16) {
          panelData.x = width - 16;
        }
      }
      forceUpdate();
    },
    [panelData, context, forceUpdate]
  );

  const onPanelHeaderDragEnd = React.useCallback(
    (e: DragState) => {
      setState((prev) => ({ ...prev, draggingHeader: false }));
      if (e.dropped === false) {
        if (panelData.parent?.mode === "float") {
          // in float mode, the position change needs to be sent to the layout
          context.onSilentChange(panelData.activeId, "move");
        }
      }
    },
    [panelData.parent?.mode, panelData.activeId, context]
  );

  const onPanelCornerDrag = React.useCallback(
    (e: DragState, corner: string) => {
      let { parent, x, y, w, h } = panelData;
      if (parent?.mode === "float") {
        movingState.current._movingCorner = corner;
        movingState.current._movingX = x;
        movingState.current._movingY = y;
        movingState.current._movingW = w;
        movingState.current._movingH = h;
        e.startDrag(null, null);
      }
    },
    [panelData]
  );

  const onPanelCornerDragT = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "t");
    },
    [onPanelCornerDrag]
  );
  const onPanelCornerDragB = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "b");
    },
    [onPanelCornerDrag]
  );
  const onPanelCornerDragL = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "l");
    },
    [onPanelCornerDrag]
  );
  const onPanelCornerDragR = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "r");
    },
    [onPanelCornerDrag]
  );
  const onPanelCornerDragTL = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "tl");
    },
    [onPanelCornerDrag]
  );
  const onPanelCornerDragTR = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "tr");
    },
    [onPanelCornerDrag]
  );
  const onPanelCornerDragBL = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "bl");
    },
    [onPanelCornerDrag]
  );
  const onPanelCornerDragBR = React.useCallback(
    (e: DragState) => {
      onPanelCornerDrag(e, "br");
    },
    [onPanelCornerDrag]
  );

  const onPanelCornerDragMove = React.useCallback(
    (e: DragState) => {
      let { dx, dy } = e;

      if (movingState.current._movingCorner.startsWith("t")) {
        // when moving top corners, dont let it move header out of screen
        let { width, height } = context.getLayoutSize();
        if (movingState.current._movingY + dy < 0) {
          dy = -movingState.current._movingY;
        } else if (movingState.current._movingY + dy > height - 16) {
          dy = height - 16 - movingState.current._movingY;
        }
      }

      switch (movingState.current._movingCorner) {
        case "t": {
          panelData.y = movingState.current._movingY + dy;
          panelData.h = movingState.current._movingH - dy;
          break;
        }
        case "b": {
          panelData.h = movingState.current._movingH + dy;
          break;
        }
        case "l": {
          panelData.x = movingState.current._movingX + dx;
          panelData.w = movingState.current._movingW - dx;
          break;
        }
        case "r": {
          panelData.w = movingState.current._movingW + dx;
          break;
        }
        case "tl": {
          panelData.x = movingState.current._movingX + dx;
          panelData.w = movingState.current._movingW - dx;
          panelData.y = movingState.current._movingY + dy;
          panelData.h = movingState.current._movingH - dy;
          break;
        }
        case "tr": {
          panelData.w = movingState.current._movingW + dx;
          panelData.y = movingState.current._movingY + dy;
          panelData.h = movingState.current._movingH - dy;
          break;
        }
        case "bl": {
          panelData.x = movingState.current._movingX + dx;
          panelData.w = movingState.current._movingW - dx;
          panelData.h = movingState.current._movingH + dy;
          break;
        }
        case "br": {
          panelData.w = movingState.current._movingW + dx;
          panelData.h = movingState.current._movingH + dy;
          break;
        }
      }

      panelData.w = Math.max(panelData.w || 0, panelData.minWidth || 0);
      panelData.h = Math.max(panelData.h || 0, panelData.minHeight || 0);

      forceUpdate();
    },
    [panelData, forceUpdate, context]
  );

  const onPanelCornerDragEnd = React.useCallback(
    (e: DragState) => {
      context.onSilentChange(panelData.activeId, "move");
    },
    [context, panelData.activeId]
  );

  const onPanelClicked = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.nativeEvent.target;
      if (
        !_ref.contains(_ref.ownerDocument.activeElement) &&
        target instanceof Node &&
        _ref.contains(target)
      ) {
        (_ref.querySelector(".dock-bar") as HTMLElement).focus();
      }
    },
    [_ref]
  );

  React.useEffect(() => {
    // componentWillUnmount
    return () => {
      if (DroppingPanel._droppingPanel === droppingPanelState) {
        DroppingPanel.droppingPanel = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (_ref) {
      let parent = panelData.parent;
      if (parent?.mode === "float") {
        _ref.addEventListener("pointerdown", onFloatPointerDown, {
          capture: true,
          passive: true,
        });
      }
    }

    return () => {
      if (_ref) {
        _ref.removeEventListener("pointerdown", onFloatPointerDown, {
          capture: true,
        });
      }
    };
  }, [_ref, onFloatPointerDown, panelData.parent]);

  // render
  let styleName = group;
  let tabGroup = context.getGroup(group);
  let { widthFlex, heightFlex } = tabGroup;
  if (panelLock) {
    let {
      panelStyle,
      widthFlex: panelWidthFlex,
      heightFlex: panelHeightFlex,
    } = panelLock;
    if (panelStyle) {
      styleName = panelStyle;
    }
    if (typeof panelWidthFlex === "number") {
      widthFlex = panelWidthFlex;
    }
    if (typeof panelHeightFlex === "number") {
      heightFlex = panelHeightFlex;
    }
  }
  let panelClass: string = classNames(groupClassNames(styleName));
  let isMax = parent?.mode === "maximize";
  let isFloat = parent?.mode === "float";
  let isHBox = parent?.mode === "horizontal";
  let isVBox = parent?.mode === "vertical";

  let _onPanelHeaderDragStart = onPanelHeaderDragStart;

  if (isMax) {
    dropFromPanel = null;
    _onPanelHeaderDragStart = null;
  }
  let cls = `dock-panel ${panelClass ? panelClass : ""}${
    dropFromPanel ? " dock-panel-dropping" : ""
  }${draggingHeader ? " dragging" : ""}`;
  let flex = 1;
  if (isHBox && widthFlex != null) {
    flex = widthFlex;
  } else if (isVBox && heightFlex != null) {
    flex = heightFlex;
  }
  let flexGrow = flex * size;
  let flexShrink = flex * 1000000;
  if (flexShrink < 1) {
    flexShrink = 1;
  }
  let style: React.CSSProperties = {
    minWidth,
    minHeight,
    flex: `${flexGrow} ${flexShrink} ${size}px`,
  };
  if (isFloat) {
    style.left = panelData.x;
    style.top = panelData.y;
    style.width = panelData.w;
    style.height = panelData.h;
    style.zIndex = panelData.z;
  }
  let droppingLayer: React.ReactNode;
  if (dropFromPanel) {
    let dropFromGroup = context.getGroup(dropFromPanel.group);
    let dockId = context.getDockId();
    if (!dropFromGroup.tabLocked || DragState.getData("tab", dockId) == null) {
      // not allowed locked tab to create new panel
      let DockDropClass = context.useEdgeDrop() ? DockDropEdge : DockDropLayer;
      droppingLayer = (
        <DockDropClass
          panelData={panelData}
          panelElement={_ref}
          dropFromPanel={dropFromPanel}
        />
      );
    }
  }

  return (
    <DragDropDiv
      getRef={setRef}
      className={cls}
      style={style}
      data-dockid={id}
      onDragOverT={isFloat ? null : onDragOver}
      onClick={onPanelClicked}
    >
      <DockTabs
        panelData={panelData}
        onPanelDragStart={_onPanelHeaderDragStart}
        onPanelDragMove={onPanelHeaderDragMove}
        onPanelDragEnd={onPanelHeaderDragEnd}
      />
      {isFloat
        ? [
            <DragDropDiv
              key="drag-size-t"
              className="dock-panel-drag-size dock-panel-drag-size-t"
              onDragStartT={onPanelCornerDragT}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-b"
              className="dock-panel-drag-size dock-panel-drag-size-b"
              onDragStartT={onPanelCornerDragB}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-l"
              className="dock-panel-drag-size dock-panel-drag-size-l"
              onDragStartT={onPanelCornerDragL}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-r"
              className="dock-panel-drag-size dock-panel-drag-size-r"
              onDragStartT={onPanelCornerDragR}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-t-l"
              className="dock-panel-drag-size dock-panel-drag-size-t-l"
              onDragStartT={onPanelCornerDragTL}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-t-r"
              className="dock-panel-drag-size dock-panel-drag-size-t-r"
              onDragStartT={onPanelCornerDragTR}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-b-l"
              className="dock-panel-drag-size dock-panel-drag-size-b-l"
              onDragStartT={onPanelCornerDragBL}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
            <DragDropDiv
              key="drag-size-b-r"
              className="dock-panel-drag-size dock-panel-drag-size-b-r"
              onDragStartT={onPanelCornerDragBR}
              onDragMoveT={onPanelCornerDragMove}
              onDragEndT={onPanelCornerDragEnd}
            />,
          ]
        : null}
      {droppingLayer}
    </DragDropDiv>
  );
});
