export default abstract class BaseClient {
    constructor();
    disconnect?(): void | Promise<void>;
    abstract connect(): void | Promise<void>;
    abstract get(key: string): any;
    abstract set(key: string, value: unknown, options: {
        expires?: number;
    }): Promise<any> | any;
    abstract del(key: string): Promise<boolean> | any;
}
//# sourceMappingURL=BaseClient.d.ts.map