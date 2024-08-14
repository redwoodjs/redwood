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
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest-dom/recommended',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true,
    },
    babelOptions: {
      configFile: findBabelConfig(),
    },
  },
  plugins: [
    'unused-imports',
    '@babel',
    'import',
    'jsx-a11y',
    'react',
    'react-hooks',
    'jest-dom',
    '@redwoodjs',
  ],
  // Prevents unused eslint-disable comments
  reportUnusedDisableDirectives: true,
  settings: {
    react: {
      version: 'detect',
    },
    // For the import/order rule. Configures how it tells if an import is "internal" or not.
    // An "internal" import is basically just one that's aliased.
    //
    // See...
    // - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md#groups-array
    // - https://github.com/import-js/eslint-plugin-import/blob/main/README.md#importinternal-regex
    'import/internal-regex': '^src/',
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'fixtures',
    'packages/babel-config/src/plugins/__tests__/__fixtures__/**/*',
    'packages/babel-config/src/__tests__/__fixtures__/**/*',
    'packages/codemods/**/__testfixtures__/**/*',
    'packages/cli/**/__testfixtures__/**/*',
  ],
  rules: {
    curly: 'error',
    'unused-imports/no-unused-imports': 'error',
    '@redwoodjs/process-env-computed': 'error',
    'no-console': 'off',
    'no-extra-semi': 'off',
    'prefer-object-spread': 'warn',
    'prefer-spread': 'warn',
    'no-unused-expressions': [
      'error',
      { allowShortCircuit: true, allowTernary: true },
    ],
    'no-useless-escape': 'off',
    camelcase: ['warn', { properties: 'never' }],
    'no-new': 'warn',
    'new-cap': ['error', { newIsCap: true, capIsNew: false }],
    'no-unused-vars': [
      'error',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
    ],
    // React rules
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        // We set this to an empty array to override the default value, which is `['builtin', 'external', 'object']`.
        // Judging by the number of issues on the repo, this option seems to be notoriously tricky to understand.
        // From what I can tell, if the value of this is `['builtin']` that means it won't sort builtins.
        // But we have a rule for builtins below (react), so that's not what we want.
        //
        // See...
        // - https://github.com/import-js/eslint-plugin-import/pull/1570
        // - https://github.com/import-js/eslint-plugin-import/issues/1565
        pathGroupsExcludedImportTypes: [],
        // Only doing this to add internal. The order here maters.
        // See https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md#groups-array
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'after',
          },
          {
            pattern: '@redwoodjs/**',
            group: 'external',
            position: 'after',
          },
          {
            // Matches...
            // - src/directives/**/*.{js,ts}
            // - src/services/**/*.{js,ts}
            // - src/graphql/**/*.sdl.{js,ts}
            //
            // Uses https://github.com/isaacs/minimatch under the hood
            // See https://github.com/isaacs/node-glob#glob-primer for syntax
            pattern: 'src/*/**/*.?(sdl.){js,ts}',
            patternOptions: {
              nobrace: true,
              noglobstar: true,
            },
            group: 'internal',
            position: 'before',
          },
        ],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$api/*'],
            message:
              'Importing from $api is only supported in *.routeHooks.{js,ts} files',
          },
        ],
      },
    ],
  },
  env: {
    // We use the most modern environment available. Then we rely on Babel to
    // transpile it to something that can run on all node versions we support
    es2022: true,
  },
  overrides: [
    // We disable react-hooks/rules-of-hooks for packages which do not deal with React code
    {
      files: [
        'packages/api-server/**/*.ts',
        'packages/graphql-server/**/*.ts',
        'packages/realtime/**/*.ts',
      ],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
    // TypeScript specific linting
    {
      files: ['*.ts', '*.mts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/stylistic',
      ],
      rules: {
        // This is disabled for now because of our legacy usage of `require`. It should be enabled in the future.
        '@typescript-eslint/no-require-imports': 'off',

        // We allow exceptions to the no-unused-vars rule for variables that start with an underscore
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
        ],

        // TODO(jgmw): Look into enabling these eventually
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/consistent-generic-constructors': 'off',
        '@typescript-eslint/consistent-indexed-object-style': 'off',
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/prefer-for-of': 'off',
        '@typescript-eslint/prefer-function-type': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',

        // Specific 'stylistic' rules we alter
        camelcase: 'off',
        curly: 'error',
      },
    },
    {
      files: ['*.test.*', '**/__mocks__/**'],
      env: {
        node: true,
        es6: true,
        commonjs: true,
        jest: true,
      },
    },
    // Set the correct environment for this eslint config file
    {
      files: ['.eslintrc.js'],
      env: {
        node: true,
        commonjs: true,
      },
    },
    // Set the correct environment for Jest config files
    {
      files: ['jest.config.js', 'jest.setup.js'],
      env: {
        node: true,
        commonjs: true,
        jest: true,
      },
    },
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
      files: ['packages/web/src/entry/index.jsx'],
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
      files: ['packages/testing/**', 'packages/vite/src/index.ts'],
      rules: {
        '@redwoodjs/process-env-computed': 'off',
      },
    },
    {
      files: ['packages/project-config/**'],
      excludedFiles: [
        '**/__tests__/**',
        '**/*.test.ts?(x)',
        '**/*.spec.ts?(x)',
      ],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: false,
            optionalDependencies: false,
            peerDependencies: true,
          },
        ],
      },
    },
  ],
}
