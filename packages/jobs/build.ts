import {
  build,
  buildEsm,
  defaultBuildOptions,
  defaultIgnorePatterns,
} from '@redwoodjs/framework-tools'
import {
  generateTypesCjs,
  generateTypesEsm,
  insertCommonJsPackageJson,
} from '@redwoodjs/framework-tools/generateTypes'

// ESM build and type generation
await buildEsm()
await generateTypesEsm()

// CJS build, type generation, and package.json insert
await build({
  buildOptions: {
    ...defaultBuildOptions,
    outdir: 'dist/cjs',
    tsconfig: 'tsconfig.cjs.json',
  },
  entryPointOptions: {
    // We don't need a CJS copy of the bins
    ignore: [...defaultIgnorePatterns, './src/bins'],
  },
})
await generateTypesCjs()
await insertCommonJsPackageJson({
  buildFileUrl: import.meta.url,
})
