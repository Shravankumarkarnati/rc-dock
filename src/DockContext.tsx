import {DockContext} from "DockContext";
import {createStrictContext} from "./services/CreateStrictContext";

export const [DockContextProvider, useDockContext] = createStrictContext<DockContext>("DockContext");
