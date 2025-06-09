import { useInternalContext } from "../internal-context.js";

export const useRenderer = () => {
    const { renderer } = useInternalContext();
    return renderer;
};
