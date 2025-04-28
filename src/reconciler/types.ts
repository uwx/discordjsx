export type HostContainer = {
    node: InternalNode | null;
    onRender?: () => void;
};

export type InternalNode = {
    type: string;
    props: Record<string, any>;
    children: InternalNode[];
}
