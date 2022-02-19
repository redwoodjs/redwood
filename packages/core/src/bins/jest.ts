import { createRequire } from 'module'

const requireFromJest = createRequire(require.resolve('jest/package.json'))

const bins = requireFromJest('./package.json')['bin']

requireFromJest(bins['jest'])
