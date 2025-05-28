import type { HostConfig, OpaqueHandle } from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants.js';
import type { HostContainer, InternalChildSet, InternalNode } from './types.js';
import { createContext } from 'react';

/*!
Some typing snippets taken from https://github.com/pmndrs/react-three-fiber

MIT License

Copyright (c) 2019-2025 Poimandres

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

 */

const LOGGING_ENABLED = false;

export type HostConfigProps = {
    Type: InternalNode['type'];
    Props: InternalNode['props'];
    Container: HostContainer;
    Instance: InternalNode;
    TextInstance: InternalNode & {
        type: '#text';
        props: {
            text: string;
        };
    };
    SuspenseInstance: InternalNode;
    HydratableInstance: never;
    FormInstance: never;
    PublicInstance: InternalNode;
    HostContext: Record<string, never>;
    UpdatePayload: null;
    ChildSet: InternalChildSet;
    TimeoutHandle: NodeJS.Timeout | number | undefined;
    NoTimeout: -1;
    TransitionStatus: null;
};

// https://github.com/facebook/react/issues/28956
type EventPriority = number;

const NoEventPriority = 0;
const NO_CONTEXT: HostConfigProps['HostContext'] = {};

let currentUpdatePriority: number = NoEventPriority;

interface HostConfigEx<
    Type,
    Props,
    Container,
    Instance,
    TextInstance,
    SuspenseInstance,
    HydratableInstance,
    FormInstance,
    PublicInstance,
    HostContext,
    UpdatePayload,
    ChildSet,
    TimeoutHandle,
    NoTimeout,
    TransitionStatus,
> extends Omit<
        HostConfig<
            Type,
            Props,
            Container,
            Instance,
            TextInstance,
            SuspenseInstance,
            HydratableInstance,
            PublicInstance,
            HostContext,
            UpdatePayload,
            ChildSet,
            TimeoutHandle,
            NoTimeout
        >,
        'getCurrentEventPriority' | 'prepareUpdate' | 'commitUpdate' | 'cloneInstance'
    > {
    /**
     * This method should mutate the `instance` and perform prop diffing if needed.
     *
     * The `internalHandle` data structure is meant to be opaque. If you bend the rules and rely on its internal fields, be aware that it may change significantly between versions. You're taking on additional maintenance risk by reading from it, and giving up all guarantees if you write something to it.
     */
    commitUpdate?(
        instance: Instance,
        type: Type,
        prevProps: Props,
        nextProps: Props,
        internalHandle: OpaqueHandle,
    ): void;

    // Undocumented
    // https://github.com/facebook/react/pull/26722
    NotPendingTransition: TransitionStatus | null;
    HostTransitionContext: React.Context<TransitionStatus>;
    // https://github.com/facebook/react/pull/28751
    setCurrentUpdatePriority(newPriority: EventPriority): void;
    getCurrentUpdatePriority(): EventPriority;
    resolveUpdatePriority(): EventPriority;
    // https://github.com/facebook/react/pull/28804
    resetFormInstance(form: FormInstance): void;
    // https://github.com/facebook/react/pull/25105
    requestPostPaintCallback(callback: (time: number) => void): void;
    // https://github.com/facebook/react/pull/26025
    shouldAttemptEagerTransition(): boolean;
    // https://github.com/facebook/react/pull/31528
    trackSchedulerEvent(): void;
    // https://github.com/facebook/react/pull/31008
    resolveEventType(): null | string;
    resolveEventTimeStamp(): number;

    /**
     * This method is called during render to determine if the Host Component type and props require some kind of loading process to complete before committing an update.
     */
    maySuspendCommit(type: Type, props: Props): boolean;
    /**
     * This method may be called during render if the Host Component type and props might suspend a commit. It can be used to initiate any work that might shorten the duration of a suspended commit.
     */
    preloadInstance(type: Type, props: Props): boolean;
    /**
     * This method is called just before the commit phase. Use it to set up any necessary state while any Host Components that might suspend this commit are evaluated to determine if the commit must be suspended.
     */
    startSuspendingCommit(): void;
    /**
     * This method is called after `startSuspendingCommit` for each Host Component that indicated it might suspend a commit.
     */
    suspendInstance(type: Type, props: Props): void;
    /**
     * This method is called after all `suspendInstance` calls are complete.
     *
     * Return `null` if the commit can happen immediately.
     *
     * Return `(initiateCommit: Function) => Function` if the commit must be suspended. The argument to this callback will initiate the commit when called. The return value is a cancellation function that the Reconciler can use to abort the commit.
     *
     */
    waitForCommitToBeReady(): ((initiateCommit: Function) => Function) | null;

    cloneInstance?(
        instance: Instance,
        type: string,
        oldProps: Props,
        newProps: Props,
        keepChildren: boolean,
        children: Instance[],
    ): Instance;
}

export const InternalHostConfig = logmixin<
    HostConfigEx<
        HostConfigProps['Type'],
        HostConfigProps['Props'],
        HostConfigProps['Container'],
        HostConfigProps['Instance'],
        HostConfigProps['TextInstance'],
        HostConfigProps['SuspenseInstance'],
        HostConfigProps['HydratableInstance'],
        HostConfigProps['FormInstance'],
        HostConfigProps['PublicInstance'],
        HostConfigProps['HostContext'],
        HostConfigProps['UpdatePayload'],
        HostConfigProps['ChildSet'],
        HostConfigProps['TimeoutHandle'],
        HostConfigProps['NoTimeout'],
        HostConfigProps['TransitionStatus']
    >
>({
    // Properties
    isPrimaryRenderer: false,
    warnsIfNotActing: false,
    supportsMutation: false,
    supportsPersistence: true,
    supportsHydration: false,

    // Mutation Methods
    // appendChildToContainer(container, child) {
    //     container.node = child;
    // },
    // removeChildFromContainer(container) {
    //     container.node = null;
    // },
    // insertInContainerBefore(container, child, beforeChild) {
    //     container.node = child;
    // },
    // clearContainer(container) {
    //     container.node = null;
    // },
    // removeChild(parent, child) {
    //     parent.children.splice(parent.children.indexOf(child), 1)
    // },
    // appendChild(parent, child) {
    //     parent.children.push(child)
    // },
    // insertBefore(parent, child, beforeChild) {
    //     parent.children.splice(parent.children.indexOf(beforeChild), 0, child)
    // },
    // commitMount() {},

    // Instance Creation
    createInstance(type, { children, key, ref, ...props }) {
        return {
            type,
            props,
            children: [],
        };
    },
    createTextInstance(text) {
        return {
            type: '#text',
            props: { text },
            children: [],
        };
    },
    shouldSetTextContent() {
        return false;
    },
    appendInitialChild(parent, child) {
        parent.children.push(child)
    },

    // Instance Updates
    commitUpdate(node, type, prev, next, handle) {
        const { children, ref, ...props } = next;
        node.props = props;
    },
    commitTextUpdate(node, oldText, newText) {
        // console.log("commitTextUpdate", [node, oldText, newText])
        node.props.text = newText;
    },

    finalizeInitialChildren: () => false,

    // Suspense
    hideInstance(instance) {
        instance.hidden = true;
    },
    unhideInstance(instance, props) {
        instance.hidden = false;
    },
    hideTextInstance(instance) {
        instance.hidden = true;
    },
    unhideTextInstance(instance, props) {
        instance.hidden = false;
    },

    // Host Contexts
    getRootHostContext: () => NO_CONTEXT,
    getChildHostContext: () => NO_CONTEXT,

    // Refs
    getPublicInstance: (instance) => instance,

    // ??? - TypeScript wants these to be defined
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur: () => {},
    afterActiveInstanceBlur: () => {},
    detachDeletedInstance: () => {},
    prepareScopeUpdate: () => {},
    getInstanceFromScope: () => null,
    shouldAttemptEagerTransition: () => false,
    trackSchedulerEvent: () => {},
    resolveEventType: () => null,
    resolveEventTimeStamp: () => -1.1,
    requestPostPaintCallback: () => {},
    maySuspendCommit: () => false,
    preloadInstance: () => true, // true indicates already loaded
    startSuspendingCommit() {},
    suspendInstance() {},
    waitForCommitToBeReady: () => null,
    NotPendingTransition: null,
    HostTransitionContext: createContext<HostConfigProps['TransitionStatus']>(null),

    setCurrentUpdatePriority: (newPriority: number) => {
        currentUpdatePriority = newPriority;
    },
    getCurrentUpdatePriority: () => currentUpdatePriority,
    resolveUpdatePriority: () =>
        currentUpdatePriority !== NoEventPriority ? currentUpdatePriority : DefaultEventPriority,
    resetFormInstance() {},

    // Commit
    prepareForCommit: () => null,
    resetAfterCommit: () => {},
    preparePortalMount: () => {},

    // Scheduling
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    supportsMicrotasks: true,
    scheduleMicrotask: queueMicrotask,

    // Persistence
    cloneInstance(instance, type, oldProps, newProps, keepChildren, children) {
        const clone: InternalNode = {
            type: type,
            props: newProps,
            children: keepChildren ? instance.children : (children ?? []),
            hidden: instance.hidden,
        };

        return clone;
    },
    createContainerChildSet: (container) => ({ child: null }),
    appendChildToContainerChildSet: (childSet, child) => {
        childSet.child = child;
    },
    finalizeContainerChildren(container, newChildren) {
        // noop
    },
    replaceContainerChildren(container, newChildren) {
        container.onRenderContainer(newChildren.child);
    },
    cloneHiddenInstance(instance, type, props) {
        return {
            type: type,
            props: props,
            children: instance.children,
            hidden: true,
        };
    },
    cloneHiddenTextInstance(instance, text) {
        return {
            type: '#text',
            props: { text },
            children: instance.children,
            hidden: true,
        };
    },
});

function logmixin<T>(obj: T): T {
    if (!LOGGING_ENABLED) return obj;

    for (const key in obj) {
        if (typeof obj[key] === 'function') {
            const orig = obj[key];
            obj[key] = function (this: T, ...args: any[]) {
                console.log(`[HostConfig] ${key}`, ...args);
                return orig.apply(this, args);
            } as any;
        }
    }

    return obj;
}
