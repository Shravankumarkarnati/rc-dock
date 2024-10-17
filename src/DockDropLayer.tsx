import * as React from "react";
import {
  BoxData,
  DockMode,
  DropDirection,
  PanelData,
  TabData,
  placeHolderStyle,
  useDockContext,
} from "./DockData";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import { DragState } from "./dragdrop/DragManager";

interface DockDropSquareProps {
  direction: DropDirection;
  depth?: number;
  panelData: PanelData;
  panelElement: HTMLElement;
}

interface DockDropSquareState {
  dropping: boolean;
}

export const DockDropSquare = React.memo(function DockDropSquareBase(
  props: DockDropSquareProps
) {
  const context = useDockContext();
  const [ref, setRef] = React.useState<null | HTMLElement>(null);

  const [state, setState] = React.useState<DockDropSquareState>({
    dropping: false,
  });

  let { panelElement: targetElement, direction, depth, panelData } = props;
  let dockId = context.getDockId();

  const onDragOver = React.useCallback(
    (e: DragState) => {
      if (!ref) return;
      setState({ dropping: true });
      let _targetElement = targetElement;
      for (let i = 0; i < depth; ++i) {
        if (_targetElement.parentElement) {
          _targetElement = _targetElement.parentElement;
        }
      }
      if (panelData.group === placeHolderStyle && direction !== "float") {
        // place holder panel should always have full size drop rect
        context.setDropRect(_targetElement, "middle", ref, e);
      } else {
        let panelSize: [number, number] = DragState.getData(
          "panelSize",
          dockId
        );
        context.setDropRect(_targetElement, direction, ref, e, panelSize);
      }
      e.accept("");
    },
    [ref, targetElement, panelData.group, direction, depth, context, dockId]
  );

  const onDragLeave = React.useCallback(
    (e: DragState) => {
      if (!ref) return;

      setState({ dropping: false });
      context.setDropRect(null, "remove", ref);
    },
    [ref, context]
  );

  const onDrop = React.useCallback(
    (e: DragState) => {
      let source: TabData | PanelData = DragState.getData("tab", dockId);
      if (!source) {
        source = DragState.getData("panel", dockId);
      }
      if (source) {
        let target: PanelData | BoxData = panelData;
        for (let i = 0; i < depth; ++i) {
          target = target.parent;
        }
        context.dockMove(source, target, direction);
      }
    },
    [dockId, panelData, context, direction, depth]
  );

  React.useEffect(() => {
    return () => {
      if (ref) {
        context.setDropRect(null, "remove", ref);
      }
    };
  }, []);

  let classes = ["dock-drop-square"];
  classes.push(`dock-drop-${direction}`);
  if (depth) {
    classes.push(`dock-drop-deep`);
  }
  if (state.dropping) {
    classes.push("dock-drop-square-dropping");
  }

  return (
    <DragDropDiv
      className={classes.join(" ")}
      onDragOverT={onDragOver}
      onDragLeaveT={onDragLeave}
      onDropT={onDrop}
      getRef={setRef}
    >
      <div className="dock-drop-square-box" />
    </DragDropDiv>
  );
});

interface DockDropLayerProps {
  panelData: PanelData;
  panelElement: HTMLElement;
  dropFromPanel: PanelData;
}

export const DockDropLayer = React.memo(function DockDropLayerBase(
  props: DockDropLayerProps
) {
  const context = useDockContext();

  let { panelData, panelElement, dropFromPanel } = props;
  let dockId = context.getDockId();

  let children: React.ReactNode[] = [];

  // check if it's whole panel dragging
  let draggingPanel = DragState.getData("panel", dockId);

  let fromGroup = context.getGroup(dropFromPanel.group);
  if (
    fromGroup.floatable !== false &&
    (!draggingPanel ||
      (!draggingPanel.panelLock && // panel with panelLock can't float
        draggingPanel.parent?.mode !== "float" && // don't show float drop when over a float panel
        !(
          fromGroup.floatable === "singleTab" && draggingPanel.tabs.length > 1
        ))) // singleTab can float only with one tab
  ) {
    children.push(
      <DockDropSquare
        key="float"
        direction="float"
        panelData={panelData}
        panelElement={panelElement}
      />
    );
  }

  if (draggingPanel !== panelData && !fromGroup.disableDock) {
    // don't drop panel to itself

    // 4 direction base drag square
    children = addDepthSquare(
      children,
      "horizontal",
      panelData,
      panelElement,
      0
    );
    children = addDepthSquare(children, "vertical", panelData, panelElement, 0);

    if (
      !draggingPanel?.panelLock &&
      panelData.group === dropFromPanel.group &&
      panelData !== dropFromPanel
    ) {
      // dock to tabs
      children.push(
        <DockDropSquare
          key="middle"
          direction="middle"
          panelData={panelData}
          panelElement={panelElement}
        />
      );
    }

    let box = panelData.parent;
    if (box && box.children.length > 1) {
      // deeper drop
      children = addDepthSquare(children, box.mode, panelData, panelElement, 1);
      if (box.parent) {
        children = addDepthSquare(
          children,
          box.parent.mode,
          panelData,
          panelElement,
          2
        );
      }
    }
  }

  return <div className="dock-drop-layer">{children}</div>;
});

const addDepthSquare = (
  children: React.ReactNode[],
  mode: DockMode,
  panelData: PanelData,
  panelElement: HTMLElement,
  depth?: number
) => {
  const newChildren = children;
  if (mode === "horizontal") {
    newChildren.push(
      <DockDropSquare
        key={`top${depth}`}
        direction="top"
        depth={depth}
        panelData={panelData}
        panelElement={panelElement}
      />,
      <DockDropSquare
        key={`bottom${depth}`}
        direction="bottom"
        depth={depth}
        panelData={panelData}
        panelElement={panelElement}
      />
    );
  } else {
    newChildren.push(
      <DockDropSquare
        key={`left${depth}`}
        direction="left"
        depth={depth}
        panelData={panelData}
        panelElement={panelElement}
      />,
      <DockDropSquare
        key={`right${depth}`}
        direction="right"
        depth={depth}
        panelData={panelData}
        panelElement={panelElement}
      />
    );
  }

  return newChildren;
};
