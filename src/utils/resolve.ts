import type { APIMessageComponentEmoji, Base64Resolvable, BufferResolvable, EmojiResolvable } from 'discord.js';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type Stream from 'node:stream';

/**
 * Resolves a BufferResolvable to a Buffer.
 * @param resource The buffer or stream resolvable to resolve
 * @returns
 * @private
 */
export async function resolveFile(resource: BufferResolvable | Stream | Blob | File): Promise<Buffer | Stream> {
    if (Buffer.isBuffer(resource)) return resource;

    if (typeof resource === 'string') {
        if (/^https?:\/\//.test(resource)) {
            const res = await fetch(resource);
            return Buffer.from(await res.arrayBuffer());
        }

        const file = resolve(resource);

        const stats = await stat(file);
        if (!stats.isFile()) throw new Error(`File not found: ${file}}`);
        return await readFile(file);
    }

    if ('arrayBuffer' in resource) {
        return Buffer.from(await resource.arrayBuffer());
    }

    return resource as Stream;
}

export function resolveEmoji(emoji: EmojiResolvable | APIMessageComponentEmoji | string): APIMessageComponentEmoji {
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