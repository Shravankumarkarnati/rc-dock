"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useForceUpdate = void 0;
const react_1 = require("react");
const useForceUpdate = () => {
    const [, setVersion] = react_1.useState(0);
    return react_1.useCallback(() => setVersion((prev) => ++prev), []);
};
exports.useForceUpdate = useForceUpdate;
