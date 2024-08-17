import type * as yargs from 'yargs';
export declare const command = "auth0";
export declare const description = "Set up auth for for Auth0";
export declare function builder(yargs: yargs.Argv): yargs.Argv<{
    force: boolean;
} & {
    verbose: boolean;
}>;
export interface Args {
    force: boolean;
}
export declare function handler(options: Args): Promise<void>;
//# sourceMappingURL=setup.d.ts.map