import { TabsProps } from "rc-tabs";
import * as React from "react";
export type Tab = NonNullable<TabsProps["items"][0]>;
interface DockTabPaneProps extends Tab {
    cacheId?: string;
    cached: boolean;
}
declare const DockTabPane: ({ cacheId, cached, prefixCls, forceRender, className, style, id, active, animated, destroyInactiveTabPane, tabKey, children, }: DockTabPaneProps) => React.JSX.Element;
export default DockTabPane;
