// Our ESLint configuration is a mixture between ESLint's recommended
// rules [^1], React's recommended rules [^2], and a bit of our own stylistic
// flair:
// - no semicolons
// - comma dangle when multiline
// - single quotes
// - always use parenthesis around arrow functions
// - enforced import sorting
//
// [^1] https://eslint.org/docs/rules/
// [^2] https://www.npmjs.com/package/eslint-plugin-react#list-of-supported-rules

let supportRedwoodAutoPageImports = false
try {
  // This will throw if the module cannot be resolved,
  // it will not resolve if the module is not built,
  // in which case we're probably
  // building the framework and don't need this plugin.
  require.resolve('@redwoodjs/eslint-plugin-redwood')
  supportRedwoodAutoPageImports = {
    files: ['web/src/Routes.js', 'web/src/Routes.ts'],
    rules: {
      'no-undef': 'off',
      '@redwoodjs/redwood/no-unavailable-pages': 'error',
    },
  }
} catch (e) {
  // noop
}

module.exports = {
  parser: 'babel-eslint',
  plugins: [
    'prettier',
    'babel',
    'import',
    'jsx-a11y',
    'react',
    'react-hooks',
    'jest-dom',
    supportRedwoodAutoPageImports && '@redwoodjs/eslint-plugin-redwood',
  ].filter(Boolean),
  ignorePatterns: ['node_modules', 'dist'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:jest-dom/recommended',
    'prettier/react',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    supportRedwoodAutoPageImports,
    {
      files: ['api/src/**'],
      globals: {
        context: 'readonly',
      },
    },
  ].filter(Boolean),
  settings: {
    // This is used to support our `import/order` configuration.
    'import/resolver': {
      'eslint-import-resolver-babel-module': {},
    },
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },
  globals: {
    gql: 'readonly',
    React: 'readonly',
    __REDWOOD__: 'readonly',
    __REDWOOD__API_PROXY_PATH: 'readonly',
  },
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'off',
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
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
    // React rules
    'react/prop-types': [
      'warn',
      {
        skipUndeclared: true,
        ignore: ['style', 'children', 'className', 'theme'],
      },
    ],
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
}
