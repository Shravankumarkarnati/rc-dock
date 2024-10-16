import * as React from "react";
import { BoxData } from "./DockData";
import { WindowPanel } from "./WindowPanel";

interface Props {
  boxData: BoxData;
}

export const WindowBox = React.memo(function WindowBoxBase({ boxData }: Props) {
  let { children } = boxData;

  let childrenRender: React.ReactNode[] = [];
  for (let child of children) {
    if ("tabs" in child) {
      childrenRender.push(<WindowPanel key={child.id} panelData={child} />);
    }
  }

  return <>{childrenRender}</>;
});

export const isWindowBoxEnabled = () =>
  typeof window === "object" &&
  (window?.navigator.platform === "Win32" ||
    window?.navigator.platform === "MacIntel");
