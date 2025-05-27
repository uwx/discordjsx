export type HostContainer = {
    onRenderContainer(container: InternalNode | null): void;
};

export type InternalNode = {
    type: string;
    props: Record<string, any>;
    children: InternalNode[];
    hidden?: boolean;
};

export type InternalChildSet = {
    child: InternalNode | null;
};
