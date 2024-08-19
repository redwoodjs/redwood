/**
 * This cache is used for RSC fetches, so that we don't re-fetch the same
 * component (i.e. page) multiple times and get stuck in a loop.
 *
 * `key`: A stringified location-like object.
 * `value`: A Promise that resolves to a React element.
 */
export declare class RscCache {
    private cache;
    private socket;
    private sendRetries;
    private isEnabled;
    constructor();
    get(key: string): Thenable<React.ReactElement> | undefined;
    set(key: string, value: Thenable<React.ReactElement>): void;
    private sendToWebSocket;
    private sendUpdateToWebSocket;
}
//# sourceMappingURL=RscCache.d.ts.map