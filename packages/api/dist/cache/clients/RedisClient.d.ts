import type { RedisClientType, RedisClientOptions } from 'redis';
import type { Logger } from '../../logger';
import BaseClient from './BaseClient';
type LoggerOptions = {
    logger?: Logger;
};
export default class RedisClient extends BaseClient {
    client?: RedisClientType | null;
    logger?: Logger;
    redisOptions?: RedisClientOptions;
    constructor(options: RedisClientOptions & LoggerOptions);
    connect(): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, value: unknown, options: {
        expires?: number;
    }): Promise<string | null | undefined>;
    del(key: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=RedisClient.d.ts.map