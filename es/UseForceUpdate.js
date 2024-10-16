import { useCallback, useState } from "react";
export const useForceUpdate = () => {
    const [, setVersion] = useState(0);
    return useCallback(() => setVersion((prev) => ++prev), []);
};
