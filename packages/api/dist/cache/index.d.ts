import type { Logger } from '../logger';
import type BaseClient from './clients/BaseClient';
export { default as MemcachedClient } from './clients/MemcachedClient';
export { default as RedisClient } from './clients/RedisClient';
export { default as InMemoryClient } from './clients/InMemoryClient';
export interface CreateCacheOptions {
    logger?: Logger;
    timeout?: number;
    prefix?: string;
    fields?: {
        id: string;
        updatedAt: string;
    };
}
export interface CacheOptions {
    expires?: number;
}
export interface CacheFindManyOptions<TFindManyArgs extends Record<string, unknown>> extends CacheOptions {
    conditions?: TFindManyArgs;
}
export type CacheKey = string | string[];
export type LatestQuery = Record<string, unknown>;
type GenericDelegate = {
    findMany: (...args: any) => any;
    findFirst: (...args: any) => any;
};
export declare const cacheKeySeparator = "-";
export declare const formatCacheKey: (key: CacheKey, prefix?: string) => string;
export declare const createCache: (cacheClient: BaseClient, options?: CreateCacheOptions) => {
    cache: <TResult>(key: CacheKey, input: () => TResult | Promise<TResult>, options?: CacheOptions) => Promise<any>;
    cacheFindMany: <TDelegate extends GenericDelegate>(key: CacheKey, model: TDelegate, options?: CacheFindManyOptions<Parameters<TDelegate["findMany"]>[0]>) => Promise<any>;
    cacheClient: BaseClient;
    deleteCacheKey: (key: CacheKey) => Promise<any>;
};
//# sourceMappingURL=index.d.ts.map