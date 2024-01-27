import { build, defaultIgnorePatterns } from '../../../../buildDefaults.mjs'

await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, './src/types.ts'],
  },
})
