import { TabPaneProps } from "rc-tabs";
import * as React from "react";
interface DockTabPaneProps extends TabPaneProps {
    cacheId?: string;
    cached: boolean;
}
declare const DockTabPane: React.NamedExoticComponent<DockTabPaneProps>;
export default DockTabPane;
