import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'
import {
  generateTypesCjs,
  generateTypesEsm,
  insertCommonJsPackageJson,
} from '@redwoodjs/framework-tools/generateTypes'

// ESM build and type generation
await build({
  buildOptions: {
    ...defaultBuildOptions,
    format: 'esm',
  },
})
await generateTypesEsm()

// CJS build, type generation, and package.json insert
await build({
  buildOptions: {
    ...defaultBuildOptions,
    outdir: 'dist/cjs',
  },
})
await generateTypesCjs()
await insertCommonJsPackageJson({
  buildFileUrl: import.meta.url,
  cjsDir: 'dist/cjs',
})
