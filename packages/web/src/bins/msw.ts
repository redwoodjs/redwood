import { createRequire } from 'module'

const requireFromMSW = createRequire(require.resolve('msw/package.json'))

const bins = requireFromMSW('./package.json')['bin']

// Most `package.json`s list their bins as relative paths, but not MSW.
requireFromMSW(`./${bins['msw']}`)
