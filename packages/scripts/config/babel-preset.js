// TODO: Determine what to do different during development, test, and production
// TODO: Get core js version
// TODO: Take a look at create-react-app. They've dropped a ton of knowledge.

const { getPaths } = require('@redwoodjs/core')

module.exports = () => ({
  presets: ['@babel/preset-react', '@babel/typescript'],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    'babel-plugin-macros',
  ],

  overrides: [
    {
      test: './api/',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '8.10.0',
            },
            useBuiltIns: 'entry',
            corejs: 3,
          },
        ],
      ],
      plugins: [
        [
          'babel-plugin-module-resolver',
          {
            alias: {
              src: getPaths().api.src,
            },
          },
        ],
      ],
    },
    {
      test: './web',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: '> 0.25%, not dead',
            useBuiltIns: 'usage',
            corejs: 3,
          },
        ],
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        [
          'babel-plugin-module-resolver',
          {
            alias: {
              src: './src',
            },
          },
        ],
        'babel-plugin-styled-components',
      ],
    },
  ],
})
