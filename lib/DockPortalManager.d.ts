import React from "react";
import { TabPaneCache } from "./DockData";
type PortalManager = {
    caches: Map<string, TabPaneCache>;
    getTabCache(id: string, owner: any): TabPaneCache;
    removeTabCache(id: string, owner: any): void;
    updateTabCache(id: string, children: React.ReactNode): void;
};
export declare const usePortalManager: () => PortalManager;
type Props = {
    children: React.ReactNode;
};
export declare const DockPortalManager: ({ children }: Props) => React.JSX.Element;
export declare const RenderDockPortals: () => React.JSX.Element;
export {};
