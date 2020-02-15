const TARGETS_NODE = '12.13.0'
const TARGETS_BROWSERS = 'defaults'
// Warning! Recommended to specify used minor core-js version, like corejs: '3.6',
// instead of corejs: 3, since with corejs: 3 will not be injected modules which
// were added in minor core-js releases.
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env
const CORE_JS_VERSION = '3.6'

// We use the recommended babel configuration for monorepos, which is a base directory
// `babel.config.js` file, but then use a per-project `.babelrc.js` file.
// Learn more: https://babeljs.io/docs/en/config-files#monorepos
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: TARGETS_NODE },
        useBuiltIns: 'usage',
        corejs: {
          version: CORE_JS_VERSION,
          proposals: true,
        },
      },
    ],
    '@babel/preset-react',
    '@babel/typescript',
  ],
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          src: './src',
        },
      },
    ],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    [
      '@babel/plugin-transform-runtime',
      {
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#core-js-aliasing
        // Setting the version here also requires `@babel/runtime-corejs3`
        corejs: { version: 3, proposals: true },
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version
        // Transform-runtime assumes that @babel/runtime@7.0.0 is installed.
        // Specifying the version can result in a smaller bundle size.
        // TODO: Grab version for package.json
        version: '^7.8.3',
      },
    ],
  ],
  overrides: [
    {
      test: ['./packages/router', './packages/web/'],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: TARGETS_BROWSERS,
            },
            modules: false,
          },
        ],
      ],
      // TODO:
      // useESModules
      // boolean, defaults to false.
      // When enabled, the transform will use helpers that do not get run through @babel/plugin-transform-modules-commonjs. This allows for smaller builds in module systems like webpack, since it doesn't need to preserve commonjs semantics.
    },
  ],
  // Only build test files when testing
  ignore:
    process.env.NODE_ENV === 'test'
      ? []
      : [/\.test\.(js|ts)/, '**/__tests__', '**/__mocks__'],
}
