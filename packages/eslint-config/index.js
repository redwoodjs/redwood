// This is the ESLint configuation used by Redwood projects.
const { getConfig } = require('@redwoodjs/internal')

const config = getConfig()

module.exports = {
  extends: [
    './shared.js',
    config.web.a11y && 'plugin:jsx-a11y/recommended',
  ].filter(Boolean),
  overrides: [
    {
      files: ['web/src/Routes.js', 'web/src/Routes.tsx'],
      rules: {
        'no-undef': 'off',
        'jsx-a11y/aria-role': [
          2,
          {
            ignoreNonDOM: true,
          },
        ],
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
