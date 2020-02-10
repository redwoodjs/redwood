# Redwood App Configuration

Develompment environment settings can be adjusted using `redwood.toml`.

## web

TODO

### web.port

TODO

### web.apiProxyPaths

TODO

## api.port

TODO

## browser.open

```
boolean = true string
```

Tells the dev server to open the browser after server start. Defaults to false if config missing.

Can instead provide a browser name to use instead of system default. E.g. `open = 'Firefox'` will auto-open in Firefox regardless of which browser is default.

Uses Webpack. For more details see [Webpack devServer.open](https://webpack.js.org/configuration/dev-server/#devserveropen)
