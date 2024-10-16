import { TabPaneCache } from "./DockData";
import * as React from "react";
declare type Context = {
    getTabCache(id: string, owner: any): TabPaneCache;
    removeTabCache(id: string, owner: any): void;
    updateTabCache(id: string, children: React.ReactNode): void;
};
export declare const DockPortalManager: ({ children, }: {
    children: React.ReactNode;
}) => JSX.Element;
export declare const useDockPortalManager: () => Context;
export {};
