import type { HostConfig, OpaqueHandle, ReactContext } from 'react-reconciler';
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

const LOGGING_ENABLED = !!process.env.DISCORDJSX_HOST_CONFIG_LOGGING;

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
            FormInstance,
            PublicInstance,
            HostContext,
            ChildSet,
            TimeoutHandle,
            NoTimeout,
            TransitionStatus
        >,
        'cloneInstance'
    > {

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
    HostTransitionContext: createContext<HostConfigProps['TransitionStatus']>(null) as unknown as ReactContext<null>,

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
