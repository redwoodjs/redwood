# Static Assets
Use this folder to add static files directly to your app. All included files and folders will be copied directly into the `/dist` folder (created when Webpack builds for production). They will also be available during development when you run `yarn rw dev`.
>Note: files will *not* hot reload while the development server is running. You'll need to manually stop/start to access file changes.

### Example Use
A file like `favicon.png` will be copied to `/dist/favicon.png`. A folder containing a file such as `static-files/my-logo.jpg` will be copied to `/dist/static-files/my-logo.jpg`. These can be referenced in your code directly without any special handling, e.g.
```
<link rel="icon" type="image/png" href="/favicon.png" />
```
and
```
<img src="/static-files/my-logo.jpg"> alt="Logo" />
```

Behind the scenes, we are using Webpack's ["copy-webpack-plugin"](https://github.com/webpack-contrib/copy-webpack-plugin).

## Best Practices
Because assets in this folder are bypassing the javascript module system, **this folder should be used sparingly** for assets such as favicons, robots.txt, manifests, libraries incompatible with Webpack, etc.

In general, it's best to import files directly into a template, page, or component. This allows Webpack to include that file in the bundle, which ensures Webpack will correctly process and move assets into the distribution folder, providing error checks and correct paths along the way.

### Example Asset Import with Webpack
Instead of handling our logo image as a static file per the example above, we can do the following:
```
import React from "react"
import logo from "./my-logo.jpg"


function Header() {
  return <img src={logo} alt="Logo" />
}

export default Header
```

Behind the scenes, we are using Webpack's ["file-loader"](https://webpack.js.org/loaders/file-loader/) and ["url-loader](https://webpack.js.org/loaders/url-loader/) (for files smaller than 10kb).
