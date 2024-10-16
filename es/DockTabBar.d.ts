import type { TabNavListProps } from "rc-tabs/lib/TabNavList";
import * as React from "react";
import * as DragManager from "./dragdrop/DragManager";
interface DockTabBarProps extends TabNavListProps {
    isMaximized: boolean;
    onDragStart?: DragManager.DragHandler;
    onDragMove?: DragManager.DragHandler;
    onDragEnd?: DragManager.DragHandler;
    TabNavList: React.ComponentType<TabNavListProps>;
}
export declare const DockTabBar: (props: DockTabBarProps) => JSX.Element;
export {};
