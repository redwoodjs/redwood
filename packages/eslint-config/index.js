// This is the ESLint configuation used by Redwood projects.
const { getConfig } = require('@redwoodjs/internal')

const config = getConfig()

module.exports = {
  extends: [
    './shared.js',
    config.web.a11y && 'plugin:jsx-a11y/recommended',
  ].filter(Boolean),
  plugins: ['@redwoodjs/eslint-plugin-redwood'],
  overrides: [
    {
      files: ['web/src/Routes.js', 'web/src/Routes.tsx'],
      rules: {
        'no-undef': 'off',
        '@redwoodjs/redwood/no-unavailable-pages': 'error',
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
      files: 'api/db/seed.js',
      env: {
        node: true,
        commonjs: true,
      },
    },
    // `web` side
    {
      files: 'web/src/**',
      env: {
        browser: true,
        es6: true,
      },
      globals: {
        React: 'readonly',
        gql: 'readonly',
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
