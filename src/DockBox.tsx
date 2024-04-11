import * as React from "react";
import { Divider, DividerChild } from "./Divider";
import { BoxData, useDockContext } from "./DockData";
import { DockPanel } from "./DockPanel";
import { useForceUpdate } from "./UseForceUpdate";

interface Props {
  size: number;
  boxData: BoxData;
}

export const DockBox = ({ boxData }: Props) => {
  const { onSilentChange } = useDockContext();

  const forceUpdate = useForceUpdate();
  const [ref, setRef] = React.useState<null | HTMLDivElement>(null);

  const getDividerData = React.useCallback(
    (idx: number) => {
      if (!ref) {
        return null;
      }
      let { children, mode } = boxData;
      let nodes = ref.childNodes;
      if (nodes.length !== children.length * 2 - 1) {
        return;
      }
      let dividerChildren: DividerChild[] = [];
      for (let i = 0; i < children.length; ++i) {
        if (mode === "vertical") {
          dividerChildren.push({
            size: (nodes[i * 2] as HTMLElement).offsetHeight,
            minSize: children[i].minHeight,
          });
        } else {
          dividerChildren.push({
            size: (nodes[i * 2] as HTMLElement).offsetWidth,
            minSize: children[i].minWidth,
          });
        }
      }
      return {
        element: ref,
        beforeDivider: dividerChildren.slice(0, idx),
        afterDivider: dividerChildren.slice(idx),
      };
    },
    [boxData, ref]
  );

  const changeSizes = React.useCallback(
    (sizes: number[]) => {
      let { children } = boxData;
      if (children.length !== sizes.length) {
        return;
      }
      for (let i = 0; i < children.length; ++i) {
        children[i].size = sizes[i];
      }
      forceUpdate();
    },
    [boxData]
  );

  const onDragEnd = React.useCallback(() => {
    onSilentChange(null, "move");
  }, [onSilentChange]);

  let { minWidth, minHeight, size, children, mode, id, widthFlex, heightFlex } =
    boxData;
  let isVertical = mode === "vertical";
  let childrenRender: React.ReactNode[] = [];
  for (let i = 0; i < children.length; ++i) {
    if (i > 0) {
      childrenRender.push(
        <Divider
          idx={i}
          key={i}
          isVertical={isVertical}
          onDragEnd={onDragEnd}
          getDividerData={getDividerData}
          changeSizes={changeSizes}
        />
      );
    }
    let child = children[i];
    if ("tabs" in child) {
      childrenRender.push(
        <DockPanel size={child.size} panelData={child} key={child.id} />
      );
      // render DockPanel
    } else if ("children" in child) {
      childrenRender.push(
        <DockBox size={child.size} boxData={child} key={child.id} />
      );
    }
  }
  let cls: string;
  let flex = 1;
  if (mode === "vertical") {
    cls = "dock-box dock-vbox";
    if (widthFlex != null) {
      flex = widthFlex;
    }
  } else {
    // since special boxes dont reuse this render function, this can only be horizontal box
    cls = "dock-box dock-hbox";
    if (heightFlex != null) {
      flex = heightFlex;
    }
  }
  let flexGrow = flex * size;
  let flexShrink = flex * 1000000;
  if (flexShrink < 1) {
    flexShrink = 1;
  }

  return (
    <div
      ref={setRef}
      className={cls}
      data-dockid={id}
      style={{
        minWidth,
        minHeight,
        flex: `${flexGrow} ${flexShrink} ${size}px`,
      }}
    >
      {childrenRender}
    </div>
  );
};
