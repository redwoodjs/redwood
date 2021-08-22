import path from 'path'

import { frameworkPkgJsonFiles } from './src/lib/framework.mjs'

const roots = frameworkPkgJsonFiles().map(path.dirname)

console.log(roots)

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
  roots: [
    '/Users/peterp/gh/redwoodjs/redwood/packages/api',
    '/Users/peterp/gh/redwoodjs/redwood/packages/api-server',
    '/Users/peterp/gh/redwoodjs/redwood/packages/auth',
    '/Users/peterp/gh/redwoodjs/redwood/packages/cli',
    '/Users/peterp/gh/redwoodjs/redwood/packages/core',
    '/Users/peterp/gh/redwoodjs/redwood/packages/eslint-config',
    '/Users/peterp/gh/redwoodjs/redwood/packages/forms',
    '/Users/peterp/gh/redwoodjs/redwood/packages/graphql-server',
    '/Users/peterp/gh/redwoodjs/redwood/packages/internal',
    '/Users/peterp/gh/redwoodjs/redwood/packages/prerender',
    '/Users/peterp/gh/redwoodjs/redwood/packages/router',
    '/Users/peterp/gh/redwoodjs/redwood/packages/structure',
    '/Users/peterp/gh/redwoodjs/redwood/packages/testing',
    '/Users/peterp/gh/redwoodjs/redwood/packages/web',
  ],
  verbose: true,
}
