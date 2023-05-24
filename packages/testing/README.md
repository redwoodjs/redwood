# @redwoodjs/testing

This package includes Redwood's Jest and Storybook config.

## Notes on Storybook

This section contains some working notes on Redwood's Storybook config, mainly the `webpackFinal` prop.

- `staticDirs`

  ```js
  ...(process.env.NODE_ENV !== 'production' && {
    staticDirs: [path.join(redwoodProjectPaths.web.base, 'public')],
  }),
  ```

  We only set `staticDirs` when running Storybook process; will fail if set for SB --build.

- resolve extensions and plugins

  ```js
  sbConfig.resolve.extensions = rwConfig.resolve.extensions
  sbConfig.resolve.plugins = rwConfig.resolve.plugins // Directory Named Plugin
  ```
