import type yargs from 'yargs';
export declare const command = "supertokens";
export declare const description = "Set up auth for for SuperTokens";
export declare function builder(yargs: yargs.Argv): Promise<yargs.Argv<{
    force: boolean;
} & {
    verbose: boolean;
}>>;
export interface Args {
    force: boolean;
}
export declare function handler(options: Args): Promise<void>;
//# sourceMappingURL=setup.d.ts.map