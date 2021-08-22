import path from 'path'

import { frameworkPkgJsonFiles } from './src/lib/framework.mjs'

const roots = frameworkPkgJsonFiles().map(path.dirname)

process.env.WEBHOOK_SECRET = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

export default {
  testMatch: ['**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/fixtures/', '/dist/', '/__fixtures__/'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        env: {
          mode: 'usage',
          coreJs: 3,
        },
        jsc: {
          target: 'es2019',
          parser: {
            decorators: true,
            dynamicImport: true,
            syntax: 'typescript',
            tsx: true, // loaders?
          },
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
    '^.+\\.(t|j)s?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        env: {
          mode: 'usage',
          coreJs: 3,
        },
        jsc: {
          target: 'es2019',
          parser: {
            decorators: true,
            dynamicImport: true,
            syntax: 'typescript',
            tsx: false,
          },
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  roots,
  verbose: true,
}
