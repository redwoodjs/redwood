import { createRequire } from 'module'

const requireFromESLint = createRequire(require.resolve('eslint/package.json'))

const bins = requireFromESLint('./package.json')['bin']

requireFromESLint(bins['eslint'])
