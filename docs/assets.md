# Assets and Files

There are two methods for adding assets to a Redwood app: Webpack imports and directly adding to the `/public` folder.

## Importing Assets

In general, it's best to import files directly into a template, page, or component. This allows Webpack to include that file in the bundle, ensuring correct processing for the distribution folder while providing error checks and correct paths along the way.

### Example Asset Import with Webpack

Using `import`, we can do the following:

```javascript
import React from 'react'
import logo from './my-logo.jpg'

function Header() {
  return <img src={logo} alt="Logo" />
}

export default Header
```

Webpack will correctly handle the file path and add the file to the distribution folder within `/dist/media` (created when Webpack builds for production).

> Note: In this example, the file `my-logo.jpg` is located in the same directory as the component. This is recommended practice to keep all files related to a component in a single directory.

Behind the scenes, we are using Webpack's ["file-loader"](https://webpack.js.org/loaders/file-loader/) and ["url-loader"](https://webpack.js.org/loaders/url-loader/) (which transforms images less than 10kb into data URIs for improved performance).

## Directly Adding Assets using the "Public" Folder

Alternately, you can add files directly to the folder "web/public", effectively adding static files to your app. All included files and folders will be copied into the production build `web/dist` folder. They will also be available during development when you run `yarn rw dev`.

Because assets in this folder are bypassing the javascript module system, **this folder should be used sparingly** for assets such as favicons, robots.txt, manifests, libraries incompatible with Webpack, etc.

> Note: files will _not_ hot reload while the development server is running. You'll need to manually stop/start to access file changes.

Behind the scenes, Redwood is using Webpack's ["copy-webpack-plugin"](https://github.com/webpack-contrib/copy-webpack-plugin).

### Example Use

Assuming `public/` includes the following:

- `favicon.png`
- `static-files/my-logo.jpg`

Running `yarn build` will copy the file `favicon.png` to `/dist/favicon.png`. The new directory with file `static-files/my-logo.jpg` will be copied to `/dist/static-files/my-logo.jpg`. These can be referenced in your code directly without any special handling, e.g.

```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

and

```html
<img src="/static-files/my-logo.jpg" alt="Logo" />
```

> Note: because the directory `dist/` becomes your production root, it should not be included in the path.
