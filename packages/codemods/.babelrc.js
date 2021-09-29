module.exports = {
  extends: '../../babel.config.js',
  overrides: [{
    plugins: [
      ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    ]
  }]
}
