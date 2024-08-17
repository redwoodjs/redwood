import type { BuildOptions } from 'esbuild';
export declare const buildApi: () => Promise<import("esbuild").BuildResult<BuildOptions>>;
export declare const rebuildApi: () => Promise<import("esbuild").BuildResult<BuildOptions>>;
export declare const cleanApiBuild: () => Promise<void>;
export declare const transpileApi: (files: string[]) => Promise<import("esbuild").BuildResult<BuildOptions>>;
//# sourceMappingURL=api.d.ts.map