import type { APIButtonComponent, APIMediaGalleryItem, APIMessageComponent, APIMessageComponentEmoji, APIMessageTopLevelComponent, APIUnfurledMediaItem, EmojiResolvable } from "discord.js";
import { ApplicationCommand, blockQuote, bold, channelMention, chatInputApplicationCommandMention, codeBlock, ComponentType, formatEmoji, heading, hideLinkEmbed, hyperlink, inlineCode, italic, MessageFlags, resolveColor, roleMention, spoiler, strikethrough, subtext, time, underline, userMention } from "discord.js";
import type { InternalNode } from "../reconciler/index.js";
import { v4 } from "uuid";
import type { DJSXEventHandlerMap } from "../types/index.js";
import type { MessagePayloadOutput, ModalPayloadOutput } from "./types.js";
import type { DefaultButtonProps, LinkButtonProps, PremiumButtonProps } from "../intrinsics/elements/button.js";
import { UnfurledMediaResolvable } from "../intrinsics/elements/base.js";
import type { DJSXElements } from "../intrinsics/elements/index.js";

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

    private getText(node: InternalNode, listType?: 'ol' | 'ul'): string {
        const getChildText = () => {
            return node.children.map(e => this.getText(e)).join("");
        }

        switch (node.type) {
            case "#text":
                return node.props.text as string;
            case "br":
                return '\n';
            case "u":
                return underline(getChildText());
            case "b":
                return bold(getChildText());
            case "i":
                return italic(getChildText());
            case "s":
                return strikethrough(getChildText()); 
            case "code":
                return inlineCode(getChildText());
            case "pre":
                return codeBlock(node.props.language ?? '', getChildText());
            case "blockquote":
                return `\n${blockQuote(getChildText())}\n`;
            case "emoji":
                return formatEmoji({
                    animated: node.props.animated,
                    id: node.props.id,
                    name: node.props.name ?? '_',
                });
            case "ul":
                return `${node.children.map(e => this.getText(e, 'ul')).join("\n")}\n`;
            case "ol":
                return `${node.children.map(e => this.getText(e, 'ol')).join("\n")}\n`;
            case "li":
                return `\n${listType === 'ol' ? '1.' : '- '}${getChildText()}`; 
            case "h1":
                return `\n${heading(getChildText(), 1)}\n`;
            case "h2":
                return `\n${heading(getChildText(), 2)}\n`;
            case "h3":
                return `\n${heading(getChildText(), 3)}\n`;
            case "subtext":
                return `\n${subtext(getChildText())}\n`;
            case "spoiler":
                return spoiler(getChildText());
            case "a":
                const childText = getChildText();
                if (!childText) return hideLinkEmbed(node.props.href);
                if (node.props.alt) return hyperlink(childText, node.props.href);
                return hyperlink(childText, node.props.href, node.props.alt);
            case "timestamp":
                return time(node.props.time, node.props.format ?? 'f');
            case "mention":
                if (node.props.user) return userMention(node.props.user);
                if (node.props.member) return `<@!${node.props.member}>`;
                if (node.props.channel) return channelMention(node.props.channel);
                if (node.props.role) return roleMention(node.props.role);
                if (node.props.command) {
                    const commandId = node.props.command instanceof ApplicationCommand ? node.props.command.id : node.props.command;
                    if (node.props.subcommandGroupName) {
                        return chatInputApplicationCommandMention(node.props.commandName, node.props.subcommandGroupName, node.props.subcommandName, commandId);
                    }
                    if (node.props.subcommandName) {
                        return chatInputApplicationCommandMention(node.props.commandName, node.props.subcommandName, commandId);
                    }
                    return chatInputApplicationCommandMention(node.props.commandName ?? '_', commandId);
                }
                return "";
            default:
                return getChildText();
        }
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
                    type: ComponentType.TextDisplay,
                    content: this.getText(node),
                };
            case "thumbnail":
                if (!node.props.media) return null;

                return {
                    type: ComponentType.Thumbnail,
                    media: typeof node.props.media === 'string' ? { url: node.props.media } : node.props.media,
                    description: node.props.description,
                    spoiler: node.props.spoiler,
                };
            case "gallery":
                if (!node.children) return null;

                return {
                    type: ComponentType.MediaGallery,
                    items: node.children
                        .filter(child => child.type === 'gallery-item')
                        .map(child => {
                            const props = child.props as DJSXElements['gallery-item'];
                            return {
                                media: typeof props.media === 'string' ? { url: props.media } : props.media,
                                description: props.description,
                                spoiler: props.spoiler,
                            };
                        }),
                };
            case "file":
                return {
                    type: ComponentType.File,
                    file: typeof node.props.file === 'string' ? { url: node.props.file } : node.props.file,
                    spoiler: node.props.spoiler,
                };
            case "separator":
                return {
                    type: ComponentType.Separator,
                    divider: node.props.divider,
                    spacing: node.props.spacing === "lg" ? 2 : 1,
                };
            case "container":
                return {
                    type: ComponentType.Container,
                    components: this.toDiscordComponentsArray(node.children) as any,
                    accent_color: node.props.color ? resolveColor(node.props.color) : undefined,
                    spoiler: node.props.spoiler,
                };
            default:
                return null;
        }
    }

    private asAPIMessageTopLevelComponent(node: InternalNode): APIMessageTopLevelComponent {
        let c = this.toDiscordComponent(node);
        if(!c) throw new Error();

        if(
            c.type === ComponentType.StringSelect
            || c.type === ComponentType.UserSelect
            || c.type === ComponentType.RoleSelect
            || c.type === ComponentType.MentionableSelect
            || c.type === ComponentType.ChannelSelect
            || c.type === ComponentType.Button
            || c.type === ComponentType.Thumbnail
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
            emoji: node.props.emoji ? this.resolveEmoji(node.props.emoji) : undefined,
        };
    }

    private resolveEmoji(emoji: EmojiResolvable | APIMessageComponentEmoji | string): APIMessageComponentEmoji {
        if (typeof emoji === 'string') {
            // Is formatted emoji
            if (emoji.startsWith('<') && emoji.endsWith('>')) {
                const emojiRe = /<(a?):([a-zA-Z0-9_]+):(\d+)>/;

                const match = emoji.match(emojiRe);
                if (match) {
                    return {
                        name: match[2],
                        id: match[3],
                        animated: match[1] === 'a',
                    };
                }
            }

            // Is snowflake
            if (Number.isInteger(Number(emoji))) {
                return { id: emoji };
            }
            
            // Is unicode emoji
            return { name: emoji };
        }

        // Is emoji object
        return {
            name: emoji.name ?? undefined,
            id: emoji.id ?? undefined,
            animated: emoji.animated ?? undefined,
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
            ...(node.props.type === "string" ? {
                options: node.children.map(child => ({
                    label: (child as InstrinsicNodesMap["option"]).props.label,
                    value: (child as InstrinsicNodesMap["option"]).props.value,
                    description: (child as InstrinsicNodesMap["option"]).props.description,
                    emoji: (child as InstrinsicNodesMap["option"]).props.emoji,
                    default: (node.props.defaultValues as string[] | undefined)?.includes((child as InstrinsicNodesMap["option"]).props.value),
                })),
            } : {}),
            ...(node.props.type === "user" || node.props.type === "role" ? {
                default_values: node.props.defaultValues?.map(id => ({ id, type: node.props.type })) as any,
            } : {}),
            ...(node.props.type === "mentionable" ? {
                default_values: node.props.defaultValues as any,
            } : {}),
            ...(node.props.type === "channel" ? {
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
