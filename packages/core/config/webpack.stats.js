const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { merge } = require('webpack-merge')

const webpackProduction = require('./webpack.production')

// https://github.com/webpack-contrib/webpack-bundle-analyzer
module.exports = merge(webpackProduction, {
  plugins: [
    new BundleAnalyzerPlugin({
      generateStatsFile: true,
      analyzerMode: 'static',
    }),
  ],
})
