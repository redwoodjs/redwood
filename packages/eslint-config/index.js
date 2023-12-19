// This is the ESLint configuration used by Redwood projects.
// Shared eslint config (projects and framework) is located in ./shared.js
// Framework main config is in monorepo root ./.eslintrc.js

const {
  getCommonPlugins,
  getApiSideDefaultBabelConfig,
  getWebSideDefaultBabelConfig,
} = require('@redwoodjs/babel-config')
const { getConfig } = require('@redwoodjs/project-config')

const config = getConfig()

const getProjectBabelOptions = () => {
  // We can't nest the web overrides inside the overrides block
  // So we just take it out and put it as a separate item
  // Ignoring overrides, as I don't think it has any impact on linting
  const { overrides: _overrides, ...otherWebConfig } =
    getWebSideDefaultBabelConfig()

  return {
    plugins: getCommonPlugins(),
    overrides: [
      {
        test: ['./api/', './scripts/'],
        ...getApiSideDefaultBabelConfig(),
      },
      {
        test: ['./web/'],
        ...otherWebConfig,
      },
    ],
  }
}

module.exports = {
  extends: [
    './shared.js',
    config.web.a11y && 'plugin:jsx-a11y/recommended',
  ].filter(Boolean),
  parserOptions: {
    requireConfigFile: false,
    babelOptions: getProjectBabelOptions(),
  },
  overrides: [
    {
      files: ['web/src/Routes.js', 'web/src/Routes.jsx', 'web/src/Routes.tsx'],
      rules: {
        'no-undef': 'off',
        'jsx-a11y/aria-role': [
          2,
          {
            ignoreNonDOM: true,
          },
        ],
        '@redwoodjs/unsupported-route-components': 'error',
      },
    },
    // `api` side
    {
      files: 'api/src/**',
      env: {
        node: true,
        es6: true,
      },
      globals: {
        gql: 'readonly',
        context: 'readonly',
      },
    },
    {
      files: ['api/src/services/**/*.ts'],
      plugins: ['@redwoodjs'],
      rules: {
        '@redwoodjs/service-type-annotations': 'off',
      },
    },
    {
      files: ['api/db/seed.js', 'scripts/**'],
      env: {
        node: true,
        commonjs: true,
      },
      globals: {
        Promise: 'readonly',
      },
    },
    // `web` side
    {
      files: 'web/src/**',
      env: {
        browser: true,
        es6: true,
        'shared-node-browser': true,
      },
      globals: {
        React: 'readonly',
        gql: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    // Test, stories, scenarios, and mock files
    {
      files: [
        '*.test.*',
        '**/__mocks__/**',
        '*.scenarios.*',
        '*.stories.*',
        '*.mock.*',
      ],
      globals: {
        mockGraphQLQuery: 'readonly',
        mockGraphQLMutation: 'readonly',
        mockCurrentUser: 'readonly',
        scenario: 'readonly',
        defineScenario: 'readonly',
      },
    },
  ],
}
