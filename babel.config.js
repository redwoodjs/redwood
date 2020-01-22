module.exports = {
  presets: ['@babel/preset-react', '@babel/typescript'],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-export-default-from'],
    ['@babel/plugin-proposal-object-rest-spread'],
    ['@babel/plugin-proposal-optional-chaining'],
  ],
  ignore: ['**/*.test.js', '**/__tests__', '**/__mocks__'],
}
