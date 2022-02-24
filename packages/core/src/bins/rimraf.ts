import { createRequire } from 'module'

const requireFromRimraf = createRequire(require.resolve('rimraf/package.json'))

// eslint-disable-next-line no-unused-expressions
requireFromRimraf('./package.json')['bin']
