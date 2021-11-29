module.exports = {
  extends: "../babel.config.js",
  presets: [
    '@redwoodjs/core/config/babel-preset',
    '@emotion/babel-preset-css-prop',
  ],
  plugins: ['babel-plugin-macros'],
}
