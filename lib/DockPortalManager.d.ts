import React from "react";
import { TabPaneCache } from "./DockData";
type PortalManager = {
    updateTabCache(id: string, children: React.ReactNode, owner: any): TabPaneCache;
    removeTabCache(id: string, owner: any): void;
};
export declare const usePortalManager: () => PortalManager;
type Props = {
    children: React.ReactNode;
};
export declare const DockPortalManager: ({ children }: Props) => React.JSX.Element;
export {};
