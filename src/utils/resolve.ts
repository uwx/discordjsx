import type { Base64Resolvable, BufferResolvable } from 'discord.js';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type Stream from 'node:stream';

/**
 * Resolves a BufferResolvable to a Buffer.
 * @param resource The buffer or stream resolvable to resolve
 * @returns
 * @private
 */
export async function resolveFile(resource: BufferResolvable | Stream): Promise<Buffer | Stream> {
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

    return resource as Stream;
}
