import type yargs from 'yargs';
export declare const command = "custom";
export declare const description = "Generate a custom auth configuration";
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