import React, { FC, memo, useCallback, useRef } from "react";
import { BoxData, DockContext } from "./DockData";
import { Divider, DividerChild } from "./Divider";
import { DockPanel } from "./DockPanel";
import { useDockContext } from "./DockContext";
import { useForceUpdateFC } from "./Hooks";

interface Props {
  size: number;
  boxData: BoxData;
}

export const DockBox: FC<Props> = memo(({ size, boxData }: Props) => {
  const context = useDockContext();

  const ref = useRef<HTMLDivElement>();
  const forceUpdate = useForceUpdateFC();

  const getRef = useCallback((r: HTMLDivElement) => {
    ref.current = r;
  }, []);

  const getDividerData = useCallback(
    (idx: number) => {
      if (!ref.current) {
        return null;
      }

      if (ref.current.childNodes.length !== boxData.children.length * 2 - 1) {
        return;
      }

      let dividerChildren: DividerChild[] = [];

      for (let i = 0; i < boxData.children.length; ++i) {
        if (boxData.mode === "vertical") {
          dividerChildren.push({
            size: (ref.current.childNodes[i * 2] as HTMLElement).offsetHeight,
            minSize: boxData.children[i].minHeight,
          });
        } else {
          dividerChildren.push({
            size: (ref.current.childNodes[i * 2] as HTMLElement).offsetWidth,
            minSize: boxData.children[i].minWidth,
          });
        }
      }

      return {
        element: ref.current,
        beforeDivider: dividerChildren.slice(0, idx),
        afterDivider: dividerChildren.slice(idx),
      };
    },
    [ref.current, boxData]
  );

  const changeSizes = useCallback(
    (sizes: number[]) => {
      if (boxData.children.length !== sizes.length) {
        return;
      }

      for (let i = 0; i < boxData.children.length; ++i) {
        boxData.children[i].size = sizes[i];
      }
      forceUpdate();
    },
    [boxData, forceUpdate]
  );

  const onDragEnd = useCallback(() => {
    context.onSilentChange(null, "move");
  }, [context]);

  let isVertical = boxData.mode === "vertical";
  let childrenRender: React.ReactNode[] = [];

  for (let i = 0; i < boxData.children.length; ++i) {
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

    let child = boxData.children[i];

    if ("tabs" in child) {
      childrenRender.push(
        <DockPanel size={child.size} panelData={child} key={child.id} />
      ); // render DockPanel
    } else if ("children" in child) {
      childrenRender.push(
        <DockBox size={child.size} boxData={child} key={child.id} />
      );
    }
  }

  let cls: string;
  let flex = 1;

  if (boxData.mode === "vertical") {
    cls = "dock-box dock-vbox";

    if (boxData.widthFlex != null) {
      flex = boxData.widthFlex;
    }
  } else {
    // since special boxes dont reuse this render function, this can only be horizontal box
    cls = "dock-box dock-hbox";

    if (boxData.heightFlex != null) {
      flex = boxData.heightFlex;
    }
  }

  let flexGrow = flex * boxData.size;
  let flexShrink = flex * 1000000;

  if (flexShrink < 1) {
    flexShrink = 1;
  }

  return (
    <div
      ref={getRef}
      className={cls}
      data-dockid={boxData.id}
      style={{
        minWidth: boxData.minWidth,
        minHeight: boxData.minHeight,
        flex: `${flexGrow} ${flexShrink} ${boxData.size}px`,
      }}
    >
      {childrenRender}
    </div>
  );
});
