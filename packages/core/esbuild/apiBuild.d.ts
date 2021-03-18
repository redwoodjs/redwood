import type { BuildOptions, BuildResult } from 'esbuild'

declare const build: (options?: BuildOptions) => Promise<BuildResult>
