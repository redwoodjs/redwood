import type yargs from 'yargs';
export declare const command = "dbAuth";
export declare const description = "Set up auth for for dbAuth";
export declare function builder(yargs: yargs.Argv): void;
export interface Args {
    webauthn: boolean | null;
    createUserModel: boolean | null;
    generateAuthPages: boolean | null;
    force: boolean;
}
export declare const handler: (options: Args) => Promise<void>;
//# sourceMappingURL=setup.d.ts.map