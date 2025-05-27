import type { APIMediaGalleryItem, APISelectMenuOption, APIUnfurledMediaItem, ColorResolvable, APIEmbedThumbnail, APIEmbedImage, APIPartialEmoji, GuildMember, User, Snowflake, Channel, ApplicationCommand, Role, TimestampStyles, ApplicationCommandSubCommand, ApplicationCommandSubGroup, BufferResolvable } from "discord.js";
import type { PropsWithChildren } from "react";
import type { UnfurledMediaResolvable } from "./base.d.ts";
import type { SelectProps } from "./select.d.ts";
import type { ButtonProps } from "./button.d.ts";
import type Stream from "node:stream";

/**
 * Either an {@link APIUnfurledMediaItem}, or a URL, or a {@link File}, or a {@link Blob}, or a
 * {@link BufferResolvable} or {@link Stream} with a filename.
 */
export type MediaItemResolvable = APIUnfurledMediaItem | UnfurledMediaResolvable | File | Blob | {
    filename: string;
    attachment: BufferResolvable | Stream | Blob;
};

export interface DJSXElements {
    // main elements
    message: PropsWithChildren<{
        v2?: boolean;
        ephemeral?: boolean;
    }> & React.JSX.IntrinsicAttributes;
    modal: PropsWithChildren<{
        title: string;
        customId?: string;
        onSubmit?: () => void;
    }> & React.JSX.IntrinsicAttributes;

    // layout
    container: PropsWithChildren<{
        color?: ColorResolvable;
        spoiler?: boolean;
    }> & React.JSX.IntrinsicAttributes;
    row: PropsWithChildren & React.JSX.IntrinsicAttributes;
    section: PropsWithChildren & React.JSX.IntrinsicAttributes;
    accessory: PropsWithChildren & React.JSX.IntrinsicAttributes;

    // interactive
    button: PropsWithChildren<ButtonProps> & React.JSX.IntrinsicAttributes;
    select: SelectProps & React.JSX.IntrinsicAttributes;
    option: Omit<APISelectMenuOption, "default"> & React.JSX.IntrinsicAttributes;

    'text-input': {
        label: string;
        placeholder?: string;
        customId?: string;
        paragraph?: boolean;
        required?: boolean;
        min?: number;
        max?: number;
        value?: string;
    } & React.JSX.IntrinsicAttributes;

    // content
    text: PropsWithChildren & React.JSX.IntrinsicAttributes;

    thumbnail: {
        description?: string;
        spoiler?: boolean;
        media?: MediaItemResolvable;
    } & React.JSX.IntrinsicAttributes;

    gallery: PropsWithChildren & React.JSX.IntrinsicAttributes;
    'gallery-item': {
        media: MediaItemResolvable;
        description?: string | null;
        spoiler?: boolean;
    } & React.JSX.IntrinsicAttributes;

    file: {
        file: MediaItemResolvable;
        spoiler?: boolean;
    } & React.JSX.IntrinsicAttributes;

    separator: {
        divider?: boolean;
        spacing?: "sm" | "lg";
    } & React.JSX.IntrinsicAttributes;

    // markdown
    u: PropsWithChildren & React.JSX.IntrinsicAttributes;
    b: PropsWithChildren & React.JSX.IntrinsicAttributes;
    i: PropsWithChildren & React.JSX.IntrinsicAttributes;
    s: PropsWithChildren & React.JSX.IntrinsicAttributes;
    code: PropsWithChildren & React.JSX.IntrinsicAttributes;
    pre: PropsWithChildren<{ language?: string }> & React.JSX.IntrinsicAttributes;
    ul: PropsWithChildren & React.JSX.IntrinsicAttributes;
    ol: PropsWithChildren & React.JSX.IntrinsicAttributes;
    li: PropsWithChildren & React.JSX.IntrinsicAttributes;
    h1: PropsWithChildren & React.JSX.IntrinsicAttributes;
    h2: PropsWithChildren & React.JSX.IntrinsicAttributes;
    h3: PropsWithChildren & React.JSX.IntrinsicAttributes;
    subtext: PropsWithChildren & React.JSX.IntrinsicAttributes;
    spoiler: PropsWithChildren & React.JSX.IntrinsicAttributes;
    a: PropsWithChildren<{ href: string, alt?: string }> & React.JSX.IntrinsicAttributes;
    emoji: APIPartialEmoji & React.JSX.IntrinsicAttributes;
    timestamp: {
        time: Date | number;
        format?: TimestampStyles;
    } & React.JSX.IntrinsicAttributes;
    mention: ({
        user: User | Snowflake;
    } | {
        member: GuildMember | Snowflake; 
    } | {
        channel: Channel | Snowflake;
    } | {
        role: Role | Snowflake;
    } | {
        commandName?: string;
        subcommandGroupName?: string;
        subcommandName?: string;
        command: ApplicationCommand | Snowflake;
    }) & React.JSX.IntrinsicAttributes;
    br: React.JSX.IntrinsicAttributes;
    blockquote: PropsWithChildren & React.JSX.IntrinsicAttributes;
};
