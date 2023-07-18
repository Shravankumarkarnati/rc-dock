import { useCallback, useRef, FC, useState, memo } from "react";
import { Divider, DividerChild } from "./Divider";
import React from "react";
import { useForceUpdateFC } from "./Hooks";

// This file passes the vibe check (check useCallback with refs)

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "horizontal" | "vertical";
}

export const DividerBox: FC<Props> = memo(
  ({ mode, children, className, ...rest }: Props) => {
    const [ref, setRef] = useState<HTMLDivElement | null>(null);
    const forceUpdate = useForceUpdateFC();

    const getRef = useCallback((r: HTMLDivElement) => {
      setRef(r);
    }, []);

    const getDividerData = useCallback(
      (idx: number) => {
        if (!ref) {
          return null;
        }

        let length = 1;

        if (Array.isArray(children)) {
          length = children.length;
        }

        if (ref.childNodes.length !== length * 2 - 1) {
          return;
        }

        let dividerChildren: DividerChild[] = [];

        for (let i = 0; i < length; ++i) {
          if (mode === "vertical") {
            dividerChildren.push({
              size: (ref.childNodes[i * 2] as HTMLElement).offsetHeight,
            });
          } else {
            dividerChildren.push({
              size: (ref.childNodes[i * 2] as HTMLElement).offsetWidth,
            });
          }
        }

        return {
          element: ref,
          beforeDivider: dividerChildren.slice(0, idx),
          afterDivider: dividerChildren.slice(idx),
        };
      },
      [ref, mode, children]
    );

    const changeSizes = useCallback(
      (sizes: number[]) => {
        if (ref.childNodes.length === sizes.length * 2 - 1) {
          for (let i = 0; i < sizes.length; ++i) {
            if (mode === "vertical") {
              (
                ref.childNodes[i * 2] as HTMLElement
              ).style.height = `${sizes[i]}px`;
            } else {
              (
                ref.childNodes[i * 2] as HTMLElement
              ).style.width = `${sizes[i]}px`;
            }
          }
          forceUpdate();
        }
      },
      [ref, mode, forceUpdate]
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
      <div ref={getRef} className={cls} {...rest}>
        {childrenRender}
      </div>
    );
  }
);
