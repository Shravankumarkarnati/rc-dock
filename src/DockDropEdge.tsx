import * as React from "react";
import {
  BoxData,
  DockMode,
  DropDirection,
  PanelData,
  TabData,
  TabGroup,
  useDockContext,
} from "./DockData";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import { DragState } from "./dragdrop/DragManager";

interface DockDropEdgeProps {
  panelData: PanelData;
  panelElement: HTMLElement;
  dropFromPanel: PanelData;
}

export const DockDropEdge = React.memo(function DockDropEdgeBase(
  props: DockDropEdgeProps
) {
  let { panelData, panelElement, dropFromPanel } = props;

  const context = useDockContext();

  const [_ref, setRef] = React.useState<null | HTMLDivElement>(null);
  React.useEffect(() => {
    // componentWillUnmount
    return () => {
      if (_ref) {
        context.setDropRect(null, "remove", _ref);
      }
    };
  }, []);

  const getDirection = React.useCallback(
    (
      e: DragState,
      group: TabGroup,
      samePanel: boolean,
      tabLength: number
    ): { direction: DropDirection; mode?: DockMode; depth: number } => {
      let rect = _ref.getBoundingClientRect();
      let widthRate = Math.min(rect.width, 500);
      let heightRate = Math.min(rect.height, 500);
      let left = (e.clientX - rect.left) / widthRate;
      let right = (rect.right - e.clientX) / widthRate;
      let top = (e.clientY - rect.top) / heightRate;
      let bottom = (rect.bottom - e.clientY) / heightRate;
      let min = Math.min(left, right, top, bottom);
      let depth = 0;
      if (group.disableDock || samePanel) {
        // use an impossible min value to disable dock drop
        min = 1;
      }
      if (min < 0) {
        return { direction: null, depth: 0 };
      } else if (min < 0.075) {
        depth = 3; // depth 3 or 4
      } else if (min < 0.15) {
        depth = 1; // depth 1 or 2
      } else if (min < 0.3) {
        // default
      } else if (group.floatable) {
        if (group.floatable === "singleTab") {
          if (tabLength === 1) {
            // singleTab can float only with one tab
            return { direction: "float", mode: "float", depth: 0 };
          }
        } else {
          return { direction: "float", mode: "float", depth: 0 };
        }
      }
      switch (min) {
        case left: {
          return { direction: "left", mode: "horizontal", depth };
        }
        case right: {
          return { direction: "right", mode: "horizontal", depth };
        }
        case top: {
          return { direction: "top", mode: "vertical", depth };
        }
        case bottom: {
          return { direction: "bottom", mode: "vertical", depth };
        }
      }
      // probably a invalid input causing everything to be NaN?
      return { direction: null, depth: 0 };
    },
    [_ref]
  );

  const getActualDepth = React.useCallback(
    (depth: number, mode: DockMode, direction: DropDirection): number => {
      let afterPanel = direction === "bottom" || direction === "right";
      if (!depth) {
        return depth;
      }
      let previousTarget: BoxData | PanelData = panelData;
      let targetBox: BoxData = panelData.parent;
      let lastDepth = 0;
      if (panelData.parent.mode === mode) {
        ++depth;
      }
      while (targetBox && lastDepth < depth) {
        if (targetBox.mode === mode) {
          if (afterPanel) {
            if (targetBox.children.at(-1) !== previousTarget) {
              // dont go deeper if current target is on different side of the box
              break;
            }
          } else {
            if (targetBox.children[0] !== previousTarget) {
              // dont go deeper if current target is on different side of the box
              break;
            }
          }
        }
        previousTarget = targetBox;
        targetBox = targetBox.parent;
        ++lastDepth;
      }
      while (depth > lastDepth) {
        depth -= 2;
      }
      return depth;
    },
    [panelData]
  );

  const onDragOver = React.useCallback(
    (e: DragState) => {
      if (!_ref) return;

      let dockId = context.getDockId();
      let draggingPanel = DragState.getData("panel", dockId);

      let fromGroup = context.getGroup(dropFromPanel.group);
      if (draggingPanel && draggingPanel.parent?.mode === "float") {
        // ignore float panel in edge mode
        return;
      }
      let { direction, mode, depth } = getDirection(
        e,
        fromGroup,
        draggingPanel === panelData,
        draggingPanel?.tabs?.length ?? 1
      );
      depth = getActualDepth(depth, mode, direction);
      if (!direction || (direction === "float" && dropFromPanel.panelLock)) {
        context.setDropRect(null, "remove", _ref);
        return;
      }
      let targetElement = panelElement;
      for (let i = 0; i < depth; ++i) {
        targetElement = targetElement.parentElement;
      }
      let panelSize: [number, number] = DragState.getData("panelSize", dockId);
      context.setDropRect(targetElement, direction, _ref, e, panelSize);
      e.accept("");
    },
    [
      panelData,
      panelElement,
      dropFromPanel,
      context.getDockId,
      context.getGroup,
      context.setDropRect,
      getDirection,
      getActualDepth,
      _ref,
    ]
  );

  const onDragLeave = React.useCallback(
    (e: DragState) => {
      if (!_ref) return;
      context.setDropRect(null, "remove", _ref);
    },
    [context.setDropRect, _ref]
  );

  const onDrop = React.useCallback(
    (e: DragState) => {
      let dockId = context.getDockId();
      let fromGroup = context.getGroup(dropFromPanel.group);
      let source: TabData | PanelData = DragState.getData("tab", dockId);
      let draggingPanel = DragState.getData("panel", dockId);
      if (!source) {
        source = draggingPanel;
      }
      if (source) {
        let { direction, mode, depth } = getDirection(
          e,
          fromGroup,
          draggingPanel === panelData,
          draggingPanel?.tabs?.length ?? 1
        );
        depth = getActualDepth(depth, mode, direction);
        if (!direction) {
          return;
        }
        let target: PanelData | BoxData = panelData;
        for (let i = 0; i < depth; ++i) {
          target = target.parent;
        }
        context.dockMove(source, target, direction);
      }
    },
    [
      panelData,
      dropFromPanel,
      context.getDockId,
      context.getGroup,
      getDirection,
      getActualDepth,
      context.dockMove,
    ]
  );

  return (
    <DragDropDiv
      getRef={setRef}
      className="dock-drop-edge"
      onDragOverT={onDragOver}
      onDragLeaveT={onDragLeave}
      onDropT={onDrop}
    />
  );
});
