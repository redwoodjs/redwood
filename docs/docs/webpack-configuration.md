# Webpack Configuration

Redwood uses webpack. And with webpack comes configuration.

One of Redwood's tenets is convention over configuration, so it's worth repeating that you don't have to do any of this!
Take the golden path and everything will work just fine.

But another of Redwood's tenets is to make the hard stuff possible. 
Whether configuring webpack counts as hard-stuff or not is up for debate, but one thing we know for sure is that it can be an epic time sink. 
We hope that documenting it well makes it fast and easy.

## Configuring Webpack

The best way to start configuring webpack is with the webpack setup command:

```bash
yarn rw setup webpack
```

This command adds a file called `webpack.config.js` to your project's `web/config` directory, creating `web/config` if it doesn't exist:

```js
// web/config/webpack.config.js

module.exports = (config, { mode }) => {
  if (mode === 'development') {
    /**
     * Add a development-only plugin
     */
  }

  /**
   * Add custom rules and plugins:
   *
   * ```
   * config.module.rules.push(YOUR_RULE)
   * config.plugins.push(YOUR_PLUGIN)
   * ```
   */

  /**
   * And make sure to return the config!
   */
  return config
}
```

This file exports a function that gets passed two arguments: `config`, which is Redwood's webpack configuration, and an object with the property `mode`, which is either `'development'` or `'production'`.

In this function, you can add custom rules and plugins or modify Redwood's webpack configuration, which you can find in `@redwoodjs/core`.
Redwood has a common webpack configuration that gets merged with others depending on your project's environment (i.e. development or production):
- [webpack.common.js](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.common.js)—the common configuration; does most of the leg work
- [webpack.development.js](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.development.js)—used when you start the dev server (`yarn rw dev`)
- [webpack.production.js](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.production.js)—used when you build the web side (`yarn rw build web`)

### Sass

Redwood comes configured with support for Sass—all you have to do is install dependencies:

```bash
yarn workspace web add -D sass sass-loader
```

### Tailwind CSS

Configuring webpack just to use Tailwind CSS? Don't! Use the setup command instead:

```
yarn rw setup ui tailwindcss
```

## Webpack Dev Server

Redwood uses [Webpack Dev Server](https://webpack.js.org/configuration/dev-server/) for local development.
When you run `yarn rw dev`, TOML keys in your `redwood.toml`'s `[web]` table, like `port` and `apiUrl`, are used as Webpack Dev Server options (in this case, [devServer.port](https://webpack.js.org/configuration/dev-server/#devserverport) and [devServer.proxy](https://webpack.js.org/configuration/dev-server/#devserverproxy) respectively).

### Passing options with `--forward`

While you can configure Webpack Dev Server in `web/config/webpack.config.js`, it's often simpler to just pass options straight to `yarn rw dev` using the `--forward` flag.

> For the full list of Webpack Dev Server options, see https://webpack.js.org/configuration/dev-server/.

#### Example: Setting the Port and Disabling Browser Opening

In addition to passing new options, you can override those in your `redwood.toml`:

```bash
yarn rw dev --forward="--port 1234 --no-open"
```

This starts your project on port `1234` and disables automatic browser opening.

#### Example: Allow External Host Access

If you're running Redwood in dev mode and trying to test your application from an external source (i.e. outside your network), you'll get an “Invalid Host Header”. To enable this workflow, run the following:

```bash
yarn rw dev --forward="--allowed-hosts example.company.com --host 0.0.0.0"
```

This starts your project and forwards it to `example.company.com`.
