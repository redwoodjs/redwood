module.exports = {
  presets: ['@babel/preset-react'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-export-default-from'],
    ['@babel/plugin-proposal-object-rest-spread'],
  ],
  ignore: ['**/*.test.js'],
}
