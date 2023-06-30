---
description: If you have to configure webpack, here's how
---

# Webpack Configuration

Redwood uses webpack. And with webpack comes configuration.

One of Redwood's tenets is convention over configuration.
Webpack is an awesome build tool, but we don't want it to be something that you have to be familiar with to be productive.
So it's worth repeating that you don't have to do any of this.

But another of Redwood's tenets is to make the hard stuff possible.
Whether configuring webpack counts as hard stuff or not is up for debate, but one thing we know for sure is that it can be an epic time sink.

Regardless, there'll probably come a time when you have to configure webpack.
Here's how.

## Configuring Webpack

To get started, run the webpack setup command:

```
yarn rw setup webpack
```

This setup command adds a file named `webpack.config.js` to your project's `web/config` directory, creating `web/config` if it doesn't exist:

```js title="web/config/webpack.config.js"
/** @returns {import('webpack').Configuration} Webpack Configuration */
module.exports = (config, { mode }) => {
  if (mode === 'development') {
    // Add dev plugin
  }

  // Add custom rules for your project
  // config.module.rules.push(YOUR_RULE)

  // Add custom plugins for your project
  // config.plugins.push(YOUR_PLUGIN)

  return config
}
```

`config` is Redwood's webpack config, and `mode` is a string that's either `'development'` or `'production'`.

If you're changing Redwood's webpack config, you should probably get familiar with it first.
You can find Redwood's webpack configs in [`@redwoodjs/core`](https://github.com/redwoodjs/redwood/tree/main/packages/core/config).
There's a few there, but the final configuration that ends up as `config` in this function is made by merging the [common configuration](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.common.js) with another depending on your project's environment (i.e. `mode`).

### Sass and Tailwind CSS

If you're about to configure webpack just to use [Sass](https://sass-lang.com/) or [Tailwind CSS](https://tailwindcss.com/), don't!
Redwood is already configured to use Sass, if the packages are there:

```
yarn workspace web add -D sass sass-loader
```

And if you want to use Tailwind CSS, just run the setup command:

```
yarn rw setup ui tailwindcss
```

## Webpack Dev Server

Redwood uses [webpack dev server](https://webpack.js.org/configuration/dev-server/) for local development.
When you run `yarn rw dev`, keys in your `redwood.toml`'s `[web]` table—like `port` and `apiUrl`—are used as webpack dev server options (in this case, [devServer.port](https://webpack.js.org/configuration/dev-server/#devserverport) and [devServer.proxy](https://webpack.js.org/configuration/dev-server/#devserverproxy) respectively).

> For all the webpack dev server options, see the [webpack dev server docs](https://webpack.js.org/configuration/dev-server/).

### Using `--forward`

While you can configure webpack dev server using `web/config/webpack.config.js`, it's often simpler to use `yarn rw dev`'s `--forward` option.

For example, if you'd prefer to go to `example.company.com` instead of `localhost:8910` when you're working on your app locally, instead of opening up the webpack config, just set webpack dev server's [`allowedHosts`](https://webpack.js.org/configuration/dev-server/#devserverallowedhosts) and [`host`](https://webpack.js.org/configuration/dev-server/#devserverhost) options straight from the CLI (note that you'll have to use kebab-case):

```
yarn rw dev --forward="--allowed-hosts example.company.com --host 0.0.0.0"
```

You can also use `--forward` to override keys in your `redwood.toml`.
For example, the following starts your app on port `1234` and disables automatic browser opening:

```
yarn rw dev --forward="--port 1234 --no-open"
```
