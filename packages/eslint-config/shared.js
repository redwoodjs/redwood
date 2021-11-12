// This ESLint configuration is shared between the Redwood framework,
// and Redwood projects.
//
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

const findUp = require('findup-sync')

const {
  getCommonPlugins,
  getWebSideDefaultBabelConfig,
  getApiSideDefaultBabelConfig,
} = require('@redwoodjs/internal')

const babelConfigPath = (cwd = process.env.RWJS_CWD ?? process.cwd()) => {
  const configPath = findUp('babel.config.js', { cwd })
  if (!configPath) {
    throw new Error(`Eslint-parser could not find a "babel.config.js" file`)
  }
  return configPath
}

const isRedwoodProject = () => {
  const tomlPath = findUp('redwood.toml', {
    cwd: process.env.RWJS_CWD ?? process.cwd(),
  })

  // @TODO DONOTMERGE WITHOUT FIXING
  // @TODO DONOTMERGE WITHOUT FIXING
  // @TODO DONOTMERGE WITHOUT FIXING
  // @TODO DONOTMERGE WITHOUT FIXING

  if (tomlPath.includes('create-redwood-app/template/redwood.toml')) {
    return false
  }

  return !!tomlPath
}

const getBabelOptions = () => {
  // We cant nest the web overrides inside the overrides block
  // So we just take it out and put it as a separate item
  const { overrides: _overrides, ...otherWebConfig } =
    getWebSideDefaultBabelConfig()

  // @TODO ignore web overrides for now
  // THis is for ROutes, Cells handling, I dont think it has any impact on eslint

  if (isRedwoodProject()) {
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
  } else {
    // For framework
    return {
      configFile: babelConfigPath(),
    }
  }
}

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:jest-dom/recommended',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: getBabelOptions(),
  },
  plugins: [
    'prettier',
    '@babel',
    'import',
    'jsx-a11y',
    'react',
    'react-hooks',
    'jest-dom',
  ],
  ignorePatterns: ['node_modules', 'dist'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'prettier/prettier': 'warn',
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
    // React rules
    'react/prop-types': [
      'warn',
      {
        skipUndeclared: true,
        ignore: ['style', 'children', 'className', 'theme'],
      },
    ],
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['*.tsx', '*.js', '*.jsx'],
      excludedFiles: ['api/src/**'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/ban-types': 'warn',
        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        camelcase: 'off',
        '@typescript-eslint/camelcase': 'off',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
        ],
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
    {
      files: [
        '.babelrc.js',
        'babel.config.js',
        '.eslintrc.js',
        '*.config.js',
        'jest.setup.js',
      ],
      env: {
        node: true,
        commonjs: true,
        jest: true,
      },
    },
  ],
}
