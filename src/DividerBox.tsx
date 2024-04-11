import * as React from "react";
import { Divider, DividerChild } from "./Divider";
import { useForceUpdate } from "./UseForceUpdate";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "horizontal" | "vertical";
}

export const DividerBox = ({ children, mode, className, ...props }: Props) => {
  const [ref, setRef] = React.useState<null | HTMLDivElement>(null);
  const forceUpdate = useForceUpdate();

  const getDividerData = React.useCallback(
    (idx: number) => {
      if (!ref) {
        return null;
      }
      let nodes = ref.childNodes;
      let length = 1;
      if (Array.isArray(children)) {
        length = children.length;
      }
      if (nodes.length !== length * 2 - 1) {
        return;
      }
      let dividerChildren: DividerChild[] = [];
      for (let i = 0; i < length; ++i) {
        if (mode === "vertical") {
          dividerChildren.push({
            size: (nodes[i * 2] as HTMLElement).offsetHeight,
          });
        } else {
          dividerChildren.push({
            size: (nodes[i * 2] as HTMLElement).offsetWidth,
          });
        }
      }
      return {
        element: ref,
        beforeDivider: dividerChildren.slice(0, idx),
        afterDivider: dividerChildren.slice(idx),
      };
    },
    [children, mode]
  );

  const changeSizes = React.useCallback(
    (sizes: number[]) => {
      let nodes = ref.childNodes;
      if (nodes.length === sizes.length * 2 - 1) {
        for (let i = 0; i < sizes.length; ++i) {
          if (mode === "vertical") {
            (nodes[i * 2] as HTMLElement).style.height = `${sizes[i]}px`;
          } else {
            (nodes[i * 2] as HTMLElement).style.width = `${sizes[i]}px`;
          }
        }
        forceUpdate();
      }
    },
    [mode]
  );

  let isVertical = mode === "vertical";
  let childrenRender: React.ReactNode = [];
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; ++i) {
      if (i > 0) {
        (childrenRender as any[]).push(
          <Divider
            idx={i}
            key={i}
            isVertical={isVertical}
            getDividerData={getDividerData}
            changeSizes={changeSizes}
          />
        );
      }
      (childrenRender as any[]).push(children[i]);
    }
  } else {
    childrenRender = children;
  }

  let cls: string;
  if (mode === "vertical") {
    cls = "divider-box dock-vbox";
  } else {
    cls = "divider-box dock-hbox";
  }
  if (className) {
    cls = `${cls} ${className}`;
  }

  return (
    <div ref={setRef} className={cls} {...props}>
      {childrenRender}
    </div>
  );
};
