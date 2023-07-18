import { createContext, useContext } from "react";
import { DockContext } from "./DockData";

export const DockContextType = createContext<DockContext>(null!);

export const DockContextProvider = DockContextType.Provider;
export const useDockContext = () => useContext(DockContextType);
