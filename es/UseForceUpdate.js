import React from "react";
export const useForceUpdate = () => {
    const [, setCount] = React.useState(1);
    return React.useCallback(() => setCount((prev) => prev++), []);
};
