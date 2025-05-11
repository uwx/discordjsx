import type { APIMediaGalleryItem, APISelectMenuOption, APIUnfurledMediaItem, ColorResolvable, APIEmbedThumbnail, APIEmbedImage, APIPartialEmoji, GuildMember, User, Snowflake, Channel, ApplicationCommand, Role } from "discord.js";
import type { PropsWithChildren } from "react";
import type { UnfurledMediaResolvable } from "./base.d.ts";
import type { SelectProps } from "./select.d.ts";
import type { ButtonProps } from "./button.d.ts";

/*!
Excerpt borrowed from DSharpPlus

The MIT License (MIT)

Copyright (c) 2015 Mike Santiago
Copyright (c) 2016-2025 DSharpPlus Development Team

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
enum TimestampFormat
{
    /** A short date. e.g. 18/06/2021. */
    ShortDate = 'd',

    /** A long date. e.g. 18 June 2021. */
    LongDate = 'D',

    /** A short date and time. e.g. 18 June 2021 03:50. */
    ShortDateTime = 'f',

    /** A long date and time. e.g. Friday 18 June 2021 03:50. */
    LongDateTime = 'F',

    /** A short time. e.g. 03:50. */
    ShortTime = 't',

    /** A long time. e.g. 03:50:15. */
    LongTime = 'T',

    /** The time relative to the client. e.g. An hour ago. */
    RelativeTime = 'R',
}

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
        media?: APIUnfurledMediaItem | UnfurledMediaResolvable;
    } & React.JSX.IntrinsicAttributes;

    gallery: PropsWithChildren & React.JSX.IntrinsicAttributes;
    'gallery-item': {
        media: APIUnfurledMediaItem | UnfurledMediaResolvable;
        description?: string | null;
        spoiler?: boolean;
    } & React.JSX.IntrinsicAttributes;

    file: {
        file: APIUnfurledMediaItem | UnfurledMediaResolvable;
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
        format?: TimestampFormat;
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
        command: ApplicationCommand | Snowflake;
    }) & React.JSX.IntrinsicAttributes;
    br: React.JSX.IntrinsicAttributes;
};
