# Babel

Redwood comes with babel configured out of the box so that you can write modern JavaScript and TypeScript without needing to worry about transpilation at all.
GraphQL tags, JSX, SVG imports—all of it's handled for you.

For those well-versed in babel config, you can find Redwood's in [@redwoodjs/internal](https://github.com/redwoodjs/redwood/tree/main/packages/internal/src/build/babel).

## Configuring Babel

For most projects, you won't need to configure babel at all, but if you need to you can configure each side (web, api) individually using side-specific `babel.config.js` files.

> **Heads up**
>
> `.babelrc{.js}` files are ignored. 
> You have to put your custom config in the appropriate side's `babel.config.js`: `web/babel.config.js` for web and `api/babel.config.js` for api.

Let's go over an example.

#### Example: Adding Emotion

Let's say we want to add the styling library [emotion](https://emotion.sh), which requires adding a babel plugin.

1. Create a `babel.config.js` file in `web`: 
```shell
touch web/babel.config.js
```
<br />

2. Add the `@emotion/babel-plugin` as a dependency: 
```shell
yarn workspace web add --dev @emotion/babel-plugin
```
<br />

3. Add the plugin to `web/babel.config.js`:
```js
// web/babel.config.js

module.exports = {
  plugins: ["@emotion"] // 👈 add the emotion plugin
}

// ℹ️ Notice how we don't need the `extends` property
```

That's it! 
Now your custom web-side babel config will be merged with Redwood's.
