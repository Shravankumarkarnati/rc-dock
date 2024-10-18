import * as React from "react";
export declare const DockPortalManager: ({ children }: Pick<Props, "children">) => JSX.Element;
declare type Props = {
    id: string;
    cached?: boolean;
    content: React.ReactNode;
} & Omit<JSX.IntrinsicElements["div"], "id" | "ref">;
export declare const DockCachedTabPortal: React.NamedExoticComponent<Props>;
export {};
