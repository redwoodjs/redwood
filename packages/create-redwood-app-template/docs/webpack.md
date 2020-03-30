# Webpack config

RedwoodJS uses webpack to bundle and build it's assets.

## Overriding Webpack config

The Webpack config can be overriden by adding a `web/config/webpack.config.js` file.

Two formats are supported:

1. Overwriting the base config

```javascript
module.exports = (config, {env}) => {
  if (env === 'development') {
    // Add dev plugin
  }
  config.module.rules.push({...})

  return config
}
```

2. Returning a completely new config

```javascript
module.exports = {
  module: {
    rules: [{...}]
  }
}
```

## Example Use

### Changing the title of the page

```javascript
module.exports = (config, { env }) => {
  config.plugins.forEach((plugin) => {
    if (plugin.constructor.name === 'HtmlWebpackPlugin') {
      plugin.options.title = 'Some Custom Title'
    }
  })

  return config
}
```

### Adding TailwindCSS support

```javascript
const configDir = __dirname

module.exports = (config) => {
  config.module.rules[0].oneOf[5] = {
    test: /\.css$/,
    sideEffects: true,
    use: [
      'style-loader',
      { loader: 'css-loader', options: { importLoaders: 1 } },
      {
        loader: 'postcss-loader',
        options: {
          config: {
            path: configDir,
          },
        },
      },
    ],
  }

  return config
}
```
