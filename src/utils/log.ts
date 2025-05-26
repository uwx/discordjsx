export function defaultLog(level: 'message' | 'warn' | 'error', category: string, message: string, ...args: any[]) {
    switch (level) {
        case 'message':
            console.log(`[${category}] ${message}`, ...args);
            break;
        case 'warn':
            console.warn(`[${category}] ${message}`, ...args);
            break;
        case 'error':
            console.error(`[${category}] ${message}`, ...args);
            break;
    }
}