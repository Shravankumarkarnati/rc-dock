"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useForceUpdate = void 0;
const react_1 = __importDefault(require("react"));
const useForceUpdate = () => {
    const [, setCount] = react_1.default.useState(1);
    return react_1.default.useCallback(() => setCount((prev) => prev++), []);
};
exports.useForceUpdate = useForceUpdate;
