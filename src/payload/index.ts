import type { APIButtonComponent, APIMediaGalleryItem, APIMessageComponent, APIMessageTopLevelComponent } from "discord.js";
import { ComponentType, MessageFlags, resolveColor } from "discord.js";
import type { InternalNode } from "../reconciler/types";
import { v4 } from "uuid";
import type { DJSXEventHandlerMap } from "../types/events";
import type { MessagePayloadOutput, ModalPayloadOutput } from "./types";
import { DefaultButtonProps, LinkButtonProps, PremiumButtonProps } from "../intrinsics/elements/button";
import { globalSuspense } from "src/intrinsics/elements";

type InstrinsicNodesMap = {
    [K in keyof React.JSX.IntrinsicElements]: {
        type: K;
        props: React.JSX.IntrinsicElements[K];
        children: IntrinsicNode[];
    };
};

type IntrinsicNode = InstrinsicNodesMap[keyof React.JSX.IntrinsicElements];

export class PayloadBuilder {
    private used?: boolean = false;

    eventHandlers: DJSXEventHandlerMap = {
        button: new Map(),
        select: new Map(),
        modalSubmit: new Map(),
    };

    prefixCustomId: () => string = () => `djsx:auto:`;
    createCustomId = () => `${this.prefixCustomId()}:${v4()}`;

    private everythingDisabled?: boolean = false;

    constructor(prefixCustomId?: () => string) {
        if (prefixCustomId) this.prefixCustomId = prefixCustomId;
    }

    withCustomIdPrefix(prefixCustomId: () => string) {
        this.prefixCustomId = prefixCustomId;
        return this;
    }

    withEverythingDisabled(everythingDisabled?: boolean) {
        this.everythingDisabled = everythingDisabled;
    }

    private getText(node: InternalNode): string {
        if (node.type == "#text") return node.props.text as string;
        return node.children.map(this.getText.bind(this)).join("");
    }

    createMessage(node: InternalNode): MessagePayloadOutput {
        if(this.used) throw new Error("You cannot re-use PayloadBuilder - please create a new one");
        this.used = true;
        if (node.type !== "message") throw new Error("Element isn't <message>");

        let flags: MessageFlags[] = [];
        if (node.props.v2) flags.push(MessageFlags.IsComponentsV2);
        if (node.props.ephemeral) flags.push(MessageFlags.Ephemeral);

        const components = this.toDiscordComponentsArray(node.children);

        return {
            flags,
            options: {
                components: components as any,
                content: node.props.v2 ? undefined : this.getText(node),
            },
        };
    }

    createModal(node: InternalNode): ModalPayloadOutput {
        if(this.used) throw new Error("You cannot re-use PayloadBuilder - please create a new one");
        this.used = true;

        const custom_id = node.props.customId || this.createCustomId();
        const components = this.toDiscordComponentsArray(node.children);

        if (node.props.onSubmit)
            this.eventHandlers.modalSubmit.set(custom_id, node.props.onSubmit);

        return {
            payload: {
                title: node.props.title,
                components: components as any,
                custom_id,
            },
        };
    }

    private toDiscordComponentsArray(children: InternalNode[]) {
        return children.map(this.toDiscordComponent.bind(this))
            .filter(x => x !== null);
    }

    private toDiscordComponent(_node: InternalNode): APIMessageComponent | null {
        let node = _node as IntrinsicNode;

        switch (node.type) {
            case "row":
                return {
                    type: ComponentType.ActionRow,
                    components: this.toDiscordComponentsArray(node.children) as any,
                };
            case "button":
                return this.toDiscordButtonComponent(node);
            case "select":
                return this.toDiscordSelectComponent(node);
            case "text-input":
                return this.toDiscordTextInputComponent(node);
            case "section":
                const nonAccessory = node.children.filter(x => x.type !== "accessory");
                const accessoryNode = node.children.find(x => x.type == "accessory")?.children[0];

                if (!accessoryNode) return null;
                const accessory = this.toDiscordComponent(accessoryNode);
                if (!accessory) return null;

                return {
                    type: ComponentType.Section,
                    components: this.toDiscordComponentsArray(nonAccessory) as any,
                    accessory: accessory as any,
                };
            case "text":
                return {
                    type: 10,
                    content: this.getText(node),
                };
            case "thumbnail":
                if (!node.props.media) return null;

                return {
                    type: 11,
                    media: { url: node.props.media },
                    description: node.props.description,
                    spoiler: node.props.spoiler,
                };
            case "gallery":
                if (!node.children) return null;

                return {
                    type: 12,
                    items: node.children.map(child => child.props as APIMediaGalleryItem),
                };
            case "file":
                return {
                    type: 13,
                    file: { url: node.props.file },
                    spoiler: node.props.spoiler,
                }
            case "separator":
                return {
                    type: 14,
                    divider: node.props.divider,
                    spacing: node.props.spacing == "lg" ? 2 : 1,
                }
            case "container":
                return {
                    type: 17,
                    components: this.toDiscordComponentsArray(node.children) as any,
                    accent_color: node.props.color ? resolveColor(node.props.color) : undefined,
                    spoiler: node.props.spoiler,
                }
            default:
                return null;
        }
    }

    private asAPIMessageTopLevelComponent(node: InternalNode): APIMessageTopLevelComponent {
        let c = this.toDiscordComponent(node);
        if(!c) throw new Error();

        if(
            c.type == ComponentType.StringSelect
            || c.type == ComponentType.UserSelect
            || c.type == ComponentType.RoleSelect
            || c.type == ComponentType.MentionableSelect
            || c.type == ComponentType.ChannelSelect
            || c.type == ComponentType.Button
            || c.type == ComponentType.Thumbnail
        ) throw new Error();

        return c;
    }

    private toDiscordButtonComponent(node: InstrinsicNodesMap["button"]): APIButtonComponent {
        let style = "skuId" in node.props ? 6 : (
            "url" in node.props ? 5 : (["primary", "secondary", "success", "danger"].indexOf(node.props.style || "primary") + 1)
        );

        const custom_id = !("skuId" in node.props || "url" in node.props) ? (node.props.customId || this.createCustomId()) : undefined;
        if (custom_id && (node.props as DefaultButtonProps).onClick) this.eventHandlers.button.set(custom_id, (node.props as DefaultButtonProps).onClick as any);

        return {
            type: 2,
            style,
            label: this.getText(node),
            custom_id,
            sku_id: (node.props as PremiumButtonProps).skuId,
            url: (node.props as LinkButtonProps).url,
            disabled: node.props.disabled,
            emoji: node.props.emoji,
        };
    }

    private toDiscordSelectComponent(node: InstrinsicNodesMap["select"]): any {
        const custom_id = node.props.customId || this.createCustomId();
        if ((node.props as any).onSelect)
            this.eventHandlers.select.set(custom_id, (node.props as any).onSelect);

        return {
            type: {
                string: 3,
                user: 5,
                role: 6,
                mentionable: 7,
                channel: 8,
            }[node.props.type],
            custom_id,
            min_values: node.props.min,
            max_values: node.props.max,
            disabled: this.everythingDisabled ? true : node.props.disabled,
            placeholder: node.props.placeholder,
            ...(node.props.type == "string" ? {
                options: node.children.map(child => ({
                    label: (child as InstrinsicNodesMap["option"]).props.label,
                    value: (child as InstrinsicNodesMap["option"]).props.value,
                    description: (child as InstrinsicNodesMap["option"]).props.description,
                    emoji: (child as InstrinsicNodesMap["option"]).props.emoji,
                    default: (node.props.defaultValues as string[] | undefined)?.includes((child as InstrinsicNodesMap["option"]).props.value),
                })),
            } : {}),
            ...(node.props.type == "user" || node.props.type == "role" ? {
                default_values: node.props.defaultValues?.map(id => ({ id, type: node.props.type })) as any,
            } : {}),
            ...(node.props.type == "mentionable" ? {
                default_values: node.props.defaultValues as any,
            } : {}),
            ...(node.props.type == "channel" ? {
                channel_types: node.props.channelTypes,
                default_values: node.props.defaultValues?.map(id => ({ id, type: "channel" })) as any,
            } : {}),
        };
    }

    private toDiscordTextInputComponent(node: InstrinsicNodesMap["text-input"]) {
        return {
            type: 4,
            custom_id: node.props.customId,
            style: node.props.paragraph ? 2 : 1,
            label: node.props.label,
            required: node.props.required,
            placeholder: node.props.placeholder,
            value: node.props.value,
            min_length: node.props.min,
            max_length: node.props.max,
        };
    }
};
