import * as React from "react";
import { BoxData } from "./DockData";
import { DockPanel } from "./DockPanel";

interface Props {
  boxData: BoxData;
}

export const FloatBox = React.memo(function FloatBoxBase({ boxData }: Props) {
  const { children } = boxData;

  const childrenRender: React.ReactNode[] = [];
  for (const child of children) {
    if ("tabs" in child) {
      childrenRender.push(
        <DockPanel size={child.size} panelData={child} key={child.id} />
      );
    }
  }

  return <div className="dock-box dock-fbox">{childrenRender}</div>;
});
