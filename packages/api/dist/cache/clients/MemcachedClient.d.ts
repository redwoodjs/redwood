import type { Client as ClientType, ClientOptions, ServerOptions } from 'memjs';
import BaseClient from './BaseClient';
export default class MemcachedClient extends BaseClient {
    client?: ClientType | null;
    servers: string;
    options: (ClientOptions<string | Buffer, Buffer | null> & ServerOptions) | undefined;
    constructor(servers: string, options?: ClientOptions & ServerOptions);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, value: unknown, options: {
        expires?: number;
    }): Promise<boolean | undefined>;
    del(key: string): Promise<boolean | undefined>;
}
//# sourceMappingURL=MemcachedClient.d.ts.map