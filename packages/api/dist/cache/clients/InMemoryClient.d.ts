import BaseClient from './BaseClient';
type CacheOptions = {
    expires?: number;
};
export default class InMemoryClient extends BaseClient {
    storage: Record<string, {
        expires: number;
        value: string;
    }>;
    constructor(data?: {});
    /**
     * Special function for testing, only available in InMemoryClient
     *
     * Returns deserialized content of cache as an array of values (without cache keys)
     *
     */
    get contents(): any[];
    disconnect(): Promise<void>;
    connect(): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, value: unknown, options?: CacheOptions): Promise<boolean>;
    del(key: string): Promise<boolean>;
    /**
     * Special functions for testing, only available in InMemoryClient
     */
    clear(): Promise<void>;
    cacheKeyForValue(value: any): string | null;
    isCached(value: any): boolean;
}
export {};
//# sourceMappingURL=InMemoryClient.d.ts.map