const path = require('path')

const { findUp } = require('@redwoodjs/project-config')

// Framework Babel config is monorepo root ./babel.config.js
// `yarn lint` runs for each workspace, which needs findUp for path to root
const findBabelConfig = (cwd = process.cwd()) => {
  const configPath = findUp('babel.config.js', cwd)
  if (!configPath) {
    throw new Error(`Eslint-parser could not find a "babel.config.js" file`)
  }
  return configPath
}

module.exports = {
  extends: path.join(__dirname, 'packages/eslint-config/shared.js'),
  parserOptions: {
    ecmaVersion: 'latest',
    babelOptions: {
      configFile: findBabelConfig(),
    },
  },
  ignorePatterns: [
    'dist',
    'fixtures',
    'packages/babel-config/src/plugins/__tests__/__fixtures__/**/*',
    'packages/babel-config/src/__tests__/__fixtures__/**/*',
    'packages/core/**/__fixtures__/**/*',
    'packages/codemods/**/__testfixtures__/**/*',
    'packages/core/config/storybook/**/*',
    'packages/studio/dist-*/**/*',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    curly: 'error',
  },
  env: {
    // We use the most modern environment available. Then we rely on Babel to
    // transpile it to something that can run on all node versions we support
    es2022: true,
  },
  overrides: [
    {
      files: ['packages/structure/src/**'],
      rules: {
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-case-declarations': 'off',
        'prefer-const': 'off',
        'no-empty': 'warn',
        'no-unused-expressions': 'off',
      },
    },
    // Browser Context
    //
    // We prevent "window" from being used, and instead require "global".
    // This is because prerender runs in the NodeJS context it's undefined.
    {
      files: [
        'packages/auth/src/**',
        'packages/forms/src/**',
        'packages/prerender/src/browserUtils/**',
        'packages/router/src/**',
        'packages/web/src/**',
      ],
      env: {
        browser: true,
      },
      globals: {
        React: 'readonly', // We auto-import React via Babel.
        window: 'off', // Developers should use `global` instead of window. Since window is undefined in NodeJS.
      },
    },
    // Prevent @redwoodjs/internal imports in runtime (web+api) packages
    {
      files: [
        'packages/auth/src/**',
        'packages/forms/src/**',
        'packages/prerender/src/browserUtils/**',
        'packages/router/src/**',
        'packages/web/src/**',
        'packages/api/src/**',
        'packages/graphql-server/src/**',
        'packages/record/src/**',
        'packages/project-config/src/**',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@redwoodjs/internal', '@redwoodjs/internal/*'],
                message:
                  'Do not import "@redwoodjs/internal" or subpackages in runtime modules, because it leads to MASSIVE bundle sizes',
              },
              {
                group: ['@redwoodjs/structure', '@redwoodjs/structure/*'],
                message:
                  'Do not import "@redwoodjs/structure" or subpackages in runtime modules, because it leads to MASSIVE bundle sizes',
              },
            ],
          },
        ],
      },
    },
    // Entry.js rules
    {
      files: ['packages/web/src/entry/index.js'],
      env: {
        browser: true,
      },
      globals: {
        React: 'readonly',
      },
    },
    // NodeJS Context
    {
      files: [
        'packages/api/src/**',
        'packages/api-server/src/**',
        'packages/cli/src/**',
        'packages/core/config/**',
        'packages/create-redwood-app/src/*.js',
        'packages/internal/src/**',
        'packages/prerender/src/**',
        'packages/structure/src/**',
        'packages/testing/src/**',
        'packages/testing/config/**',
        'packages/eslint-config/*.js',
        'packages/record/src/**',
        'packages/telemetry/src/**',
        'packages/vite/bins/**',
      ],
      env: {
        node: true,
      },
    },
    // Prevent bad imports in Node packages - cli and api packages
    {
      files: [
        'packages/api/src/**',
        'packages/api-server/src/**',
        'packages/cli/src/**',
        'packages/internal/src/**',
        'packages/prerender/src/**',
        'packages/structure/src/**',
        'packages/testing/src/**',
        'packages/testing/config/**',
        'packages/eslint-config/*.js',
        'packages/record/src/**',
        'packages/telemetry/src/**',
      ],
      rules: {
        'no-restricted-imports': [
          // for import x from ('@redwoodjs/internal')
          'error',
          {
            name: '@redwoodjs/internal',
            message:
              'To prevent bloat in CLI, do not import "@redwoodjs/internal" directly. Instead import like @redwoodjs/internal/dist/<file>, or await import',
          },
        ],
        'no-restricted-modules': [
          // for require('@redwoodjs/internal')
          'error',
          {
            name: '@redwoodjs/internal',
            message:
              'To prevent bloat in CLI, do not require "@redwoodjs/internal" directly. Instead require like @redwoodjs/internal/dist/<file>',
          },
        ],
      },
    },
    // Allow computed member access on process.env in NodeJS contexts and tests
    {
      files: [
        'packages/core/config/webpack.common.js',
        'packages/testing/**',
        'packages/vite/src/index.ts',
      ],
      rules: {
        '@redwoodjs/process-env-computed': 'off',
      },
    },
  ],
}
