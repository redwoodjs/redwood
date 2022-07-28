const path = require('path')

const findUp = require('findup-sync')

// Framework Babel config is monorepo root ./babel.config.js
// `yarn lint` runs for each workspace, which needs findup for path to root
const findBabelConfig = (cwd = process.cwd()) => {
  const configPath = findUp('babel.config.js', { cwd })
  if (!configPath) {
    throw new Error(`Eslint-parser could not find a "babel.config.js" file`)
  }
  return configPath
}

module.exports = {
  extends: path.join(__dirname, 'packages/eslint-config/shared.js'),
  parserOptions: {
    babelOptions: {
      configFile: findBabelConfig(),
    },
  },
  ignorePatterns: [
    'dist',
    'fixtures',
    'packages/structure/**',
    'packages/internal/src/build/babelPlugins/__tests__/__fixtures__/**/*',
    'packages/core/**/__fixtures__/**/*',
    'packages/codemods/**/__testfixtures__/**/*',
    'packages/core/config/storybook/**/*',
    'packages/create-redwood-app/template/web/src/Routes.tsx',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    curly: 'error',
  },
  overrides: [
    {
      // We override import order of the CRWA graphql function because we want the grouped glob imports
      // to be ordered separately.
      // Note: for some reason, the pattern as eslints each file to match against the pattern
      // the files pattern has to be the filename and not the relative path (as one might expect)
      files: ['graphql.ts'],
      rules: {
        'import/order': 'off',
      },
    },
    {
      files: ['packages/structure/**'],
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
        es6: true,
        browser: true,
      },
      globals: {
        React: 'readonly', // We auto-import React via Babel.
        window: 'off', // Developers should use `global` instead of window. Since window is undefined in NodeJS.
      },
    },
    // Entry.js rules
    {
      files: ['packages/web/src/entry/index.js'],
      env: {
        es6: true,
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
      ],
      env: {
        es6: true,
        node: true,
      },
    },
  ],
}
