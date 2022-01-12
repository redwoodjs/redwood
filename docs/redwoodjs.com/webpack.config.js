const path = require('path')
const CameronJSHtmlWebpackPlugin = require('cameronjs-html-webpack-plugin')
const webpack = require('webpack')
require('dotenv').config()

module.exports = {
  devtool: 'source-map',
  entry: './code/javascripts/application.js',
  mode: process.env.NODE_ENV || 'development',
  output: {
    filename: 'javascripts/application.js',
    path: path.resolve(__dirname, 'publish'),
  },
  plugins: [
    new CameronJSHtmlWebpackPlugin({
      source: './code/html',
      layouts: 'layouts',
      partials: 'partials',
    }),
    new webpack.DefinePlugin({
      'process.env.ALGOLIA_APP_ID': JSON.stringify(process.env['ALGOLIA_APP_ID']),
      'process.env.ALGOLIA_API_KEY': JSON.stringify(process.env['ALGOLIA_API_KEY']),
      'process.env.ALGOLIA_SEARCH_KEY': JSON.stringify(process.env['ALGOLIA_SEARCH_KEY']),
      'process.env.ALGOLIA_INDEX_NAME': JSON.stringify(
        process.env['CONTEXT'] && process.env['CONTEXT'] !== 'production'
          ? process.env['ALGOLIA_BRANCH_INDEX_NAME']
          : process.env['ALGOLIA_INDEX_NAME']
      ),
    }),
  ],
  watchOptions: {
    ignored: /node_modules/,
  },
}
