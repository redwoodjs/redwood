const {
  getWebSideDefaultBabelConfig,
} = require('@redwoodjs/internal/dist/build/babel/web')

module.exports = getWebSideDefaultBabelConfig({ forJest: true })
