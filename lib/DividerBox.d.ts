import * as React from "react";
interface Props extends React.HTMLAttributes<HTMLDivElement> {
    mode?: "horizontal" | "vertical";
}
export declare const DividerBox: ({ children, mode, className, ...props }: Props) => React.JSX.Element;
export {};
