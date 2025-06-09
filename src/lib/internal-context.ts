import { createContext, useContext } from "react";
import { DJSXMessageRenderer } from "../renderer/DJSXRenderer.js";

export interface IInternalContext {
    renderer: DJSXMessageRenderer;
};

export const InternalContext = createContext<IInternalContext | null>(null);

export const useInternalContext = () => {
    const ctx = useContext(InternalContext);
    if(!ctx) throw new Error("InternalContext not found");
    return ctx;
};
