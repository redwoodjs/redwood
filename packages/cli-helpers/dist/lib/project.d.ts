import type { Config } from '@redwoodjs/project-config';
export declare const getGraphqlPath: () => string | null;
export declare const graphFunctionDoesExist: () => boolean | "" | null;
export declare const isTypeScriptProject: () => boolean;
export declare const getInstalledRedwoodVersion: () => any;
/**
 * Updates the project's redwood.toml file to include the specified packages plugin
 *
 * Uses toml parsing to determine if the plugin is already included in the file and
 * only adds it if it is not.
 *
 * Writes the updated config to the file system by appending strings, not stringify-ing the toml.
 */
export declare const updateTomlConfig: (packageName: string) => void;
export declare const updateTomlConfigTask: (packageName: string) => {
    title: string;
    task: () => void;
};
export declare const addEnvVarTask: (name: string, value: string, comment: string) => {
    title: string;
    task: () => void;
};
export declare const addEnvVar: (name: string, value: string, comment: string) => string | void;
/**
 * This sets the `RWJS_CWD` env var to the redwood project directory. This is typically required for internal
 * redwood packages to work correctly. For example, `@redwoodjs/project-config` uses this when reading config
 * or paths.
 *
 * @param cwd Explicitly set the redwood cwd. If not set, we'll try to determine it automatically. You likely
 * only want to set this based on some specific input, like a CLI flag.
 */
export declare const setRedwoodCWD: (cwd?: string) => void;
/**
 * Create or update the given setting, in the given section, with the given value.
 *
 * If the section already exists it adds the new setting last
 * If the section, and the setting, already exists, the setting is updated
 * If the section does not exist it is created at the end of the file and the setting is added
 * If the setting exists in the section, but is commented out, it will be uncommented and updated
 */
export declare function setTomlSetting(section: keyof Config, setting: string, value: string | boolean | number): void;
//# sourceMappingURL=project.d.ts.map