# Redwood App Configuration

Development environment settings can be adjusted using `redwood.toml`.

## [web]

This table contains the configuration for web side.

### web.host

The hostname (string) to listen to for the web server, defaults to `localhost`.  When running the server within containers/VMs, using `0.0.0.0` would allow network connections to/from the host.

### web.port

The port number (integer) to listen to for the web side.

### web.apiProxyPaths

TODO

## [api]

This table contains the configuration for api side.

## api.host

The hostname (string) to listen to for the web server, defaults to `localhost`.  When running the server within containers/VMs, using `0.0.0.0` would allow network connections to/from the host.

## api.port

The port number (integer) to listen to for the api side.

## browser.open

```
boolean = true string
```

Tells the dev server to open the browser after server start. Defaults to false if config missing.

Can instead provide a browser name to use instead of system default. E.g. `open = 'Firefox'` will auto-open in Firefox regardless of which browser is default.

Uses Webpack. For more details see [Webpack devServer.open](https://webpack.js.org/configuration/dev-server/#devserveropen)
