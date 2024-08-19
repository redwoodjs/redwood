import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'
import {
  generateTypesCjs,
  generateTypesEsm,
  insertCommonJsPackageJson,
} from '@redwoodjs/framework-tools/generateTypes'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build.json',
    format: 'esm',
    packages: 'external',
  },
})
await generateTypesEsm()

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.cjs.json',
    outdir: 'dist/cjs',
    packages: 'external',
  },
})
await generateTypesCjs()
await insertCommonJsPackageJson({
  buildFileUrl: import.meta.url,
  cjsDir: 'dist/cjs',
})
