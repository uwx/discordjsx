import Mutex from "./mutex.js";

/**
 * Debounce calls to an async function. This function makes several useful assurances:
 * 
 * - If the function is called again before the timeout, the timeout is reset.
 * - If the callback is mid-execution when the function is called again, it will be queued.
 * - If there is already an entry in the queue, it will be replaced.
 * - At most one callback will be executed at a given time.
 *
 * @param fn The callback
 * @param ms Duration in milliseconds to wait for (at least) before executing the callback
 * @returns The debounced function
 */
export function debounceAsync<F extends (this: This, ...args: Args) => PromiseLike<void>, This, Args extends any[]>(fn: F, ms = 300, mutex = new Mutex()): F {
    let timeoutId: NodeJS.Timeout;
    let next: [This, Args] | undefined;

    return function (this: This, ...args: Args) {
        if (mutex.isLocked) {
            next = [this, args];
            return;
        }

        clearTimeout(timeoutId);
        timeoutId = setTimeout(async function execute(thisArg: This, args: Args) {
            await mutex.runInMutex(fn, thisArg, args);

            if (next) {
                timeoutId = setTimeout(execute, ms, ...next);
                next = undefined;
            }
        }, ms, this, args);
    } as F;
}
