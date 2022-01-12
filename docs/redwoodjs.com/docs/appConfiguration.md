# App Configuration: redwood.toml

You can configure your Redwood app's settings in `redwood.toml`. By default, `redwood.toml` lists the following configuration options:

```toml
[web]
  title = "Redwood App"
  port = 8910
  apiUrl = "/.redwood/functions"
  includeEnvironmentVariables = []
[api]
  port = 8911
[browser]
  open = true
```

These are listed by default because they're the ones that you're most likely to configure. But there are plenty more available. The rest are spread between Redwood's [webpack configuration files](https://github.com/redwoodjs/redwood/tree/main/packages/core/config) and `@redwoodjs/internal`'s [config.ts](https://github.com/redwoodjs/redwood/blob/main/packages/internal/src/config.ts#L70-L99):

The options and their structure are based on Redwood's notion of sides and targets. Right now, Redwood has two fixed sides, API and Web, that target NodeJS Lambdas and Browsers respectively. In the future, we'll add support for more sides and targets, like Electron and React Native (you can already see them listed as enums in [TargetEnum](https://github.com/redwoodjs/redwood/blob/d51ade08118c17459cebcdb496197ea52485364a/packages/internal/src/config.ts#L11-L12)), and as we do, you'll see them reflected in `redwood.toml`. But right now, you'll most likely never touch options like `target`.

The idea is that, in the future, changes here will have cascading, "app-level" effects. Using generators as an example, based on your side and target, the generators will behave differently, but appropriately different.

> For the difference between a side and a target, see [Redwood File Structure](https://redwoodjs.com/tutorial/redwood-file-structure).

You can think of `redwood.toml` as a convenience layer over Redwood's webpack configuration files. That is, for certain settings, instead of having to deal with webpack directly, we give you quick access via `redwood.toml`. Some of these settings are for development, some are for production, and some are for both. You can actually see this reflected in which webpack file each configuration option is referenced in&mdash;[webpack.development.js](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.development.js), [webpack.production.js](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.production.js), and [webpack.common.js](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.common.js).

<!-- https://github.com/redwoodjs/redwood/pull/152#issuecomment-593835518 -->

`redwood.toml` also serves a slightly larger purpose: it's used to determine the base directory of a Redwood project. So this file is what really makes a Redwood app a Redwood app. If you remove it and run `yarn rw dev`, you'll get an error:

```terminal
Error: Could not find a "redwood.toml" file, are you sure you're in a Redwood project?
```

(So don't do that!)

## [web]

Configuration for the web side.

| Key                           | Description                                                                | Default                 | Context       |
| :---------------------------- | :------------------------------------------------------------------------- | :---------------------- | :------------ |
| `title`                       | Title of your Redwood App                                                  | `'Redwood App'`         | `both`        |
| `host`                        | Hostname to listen on                                                      | `'localhost'`           | `development` |
| `port`                        | Port to listen on                                                          | `8910`                  | `development` |
| `path`                        | Path to the web side                                                       | `'./web'`               | `both`        |
| `target`                      | Target for the web side                                                    | `'browser'`             | `both`        |
| `apiUrl`                      | Specify the URL to your api-server. Can be an absolute path or FQDN        | `'/.redwood/functions'` | `production`  |
| `apiGraphQLUrl`               | Optional: URL or absolute path to GraphQL function, without trailing slash | `${apiUrl}/graphql`     | `production`  |
| `apiDbAuthUrl`                | Optional: URL or absolute path to DbAuth function, without trailing slash  | `${apiUrl}/auth`        | `production`  |
| `includeEnvironmentVariables` | Environment variables to whitelist                                         |                         | `both`        |
| `fastRefresh`                 | Enable webpack's fast refresh                                              | true                    | `development` |
| `a11y`                        | Enable storybook `addon-a11y` and `eslint-plugin-jsx-a11y`                 | true                    | `development` |

### API Paths

You have full control over the path to your serverless functions via `apiUrl`. You can specify it either as a path (below) or a URL:

```toml
[web]
  apiUrl = "/.redwood/functions"
```

When you're running your app locally, this gets aliased away (you can see exactly how in [webpack.common.js](https://github.com/redwoodjs/redwood/blob/main/packages/core/config/webpack.development.js#L22) (and here's the docs on Webpack's [devServer.proxy](https://webpack.js.org/configuration/dev-server/#devserverproxy), for good measure)).

When you run `redwood setup deploy [provider]` on the CLI, this path gets configured to the default for the provider you're configuring

#### Customizing the GraphQL Endpoint

By default, Redwood constructs the GraphQL endpoint from `apiUrl` such that `./redwood/functions/graphql` ends up being the default graphql endpoint.
But sometimes you want to host your api side somewhere else, or even on a different domain. There's two ways you can do this:

**a) Change `apiUrl` to your new domain**

```toml
[web]
  apiUrl = "https://api.coolredwoodapp.com"
```

This means your Redwood project's web side (i.e. the frontend) points to the above domain, and tries to access the GraphQL endpoint at `https://api.coolredwoodapp.com/graphql`.

**b) Change only the graphql endpoint**

You can also change the GraphQL endpoint only (without affecting other things, like dbAuth):

```diff
[web]
  apiUrl = "/.redwood/functions"
+ apiGraphqlEndpoint = "https://coolrwapp.mycdn.com"
```

This is particularly useful if you'd like to use a CDN provider like GraphCDN in front of your api side, independent of the web side.

#### Customizing the DbAuth Endpoint

If you're using dbAuth, you may decide to point your auth function (i.e. the serverless function used for login/signup) at a different host. To do this without affecting your GraphQL endpoint, you can add `apiDbAuthUrl` to your `redwood.toml`:

```diff
[web]
  apiUrl = "/.redwood/functions"
+ apiDbAuthUrl = "https://api.mycoolapp.com/auth"
```

> **Quick note**: if you point your web side to a different domain, please make sure you have [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) configured. Otherwise browser security features may block requests from the client.

### includeEnvironmentVariables

<!-- https://github.com/redwoodjs/redwood/issues/427 -->
<!-- https://github.com/redwoodjs/redwood/blob/d51ade08118c17459cebcdb496197ea52485364a/packages/core/config/webpack.common.js#L17-L31 -->

```toml
[web]
  includeEnvironmentVariables = ['API_KEY']
```

Where `API_KEY` is defined in .env or .env.defaults:

```plaintext
API_KEY=...
```

`includeEnvironmentVariables` is the set of environment variables to whitelist for the web side. You can also prefix environment variables with `REDWOOD_ENV_` (see [Environment Variables](https://redwoodjs.com/docs/environment-variables#web)).

## [api]

Configuration for the api side.

| Key            | Description                         | Default                    | Context       |
| :------------- | :---------------------------------- | :------------------------- | :------------ |
| `host`         | Hostname to listen on               | `'localhost'`              | `development` |
| `port`         | Port to listen on                   | `8911`                     | `development` |
| `path`         | Path to the api side                | `'./api'`                  | `both`        |
| `serverConfig` | Path to the `server.config.js` file | `'./api/server.config.js'` | `both`        |
| `target`       | Target for the api side             | `'node'`                   | `both`        |

### Server Configuration

You can customize the Fastify Server settings used by the RedwoodJS dev server by defining `server.config.js` file and declaring where to find it using the `serverConfig` key.

#### Example Server Configuration

The following is an example `server.config.js` and what is the current default if a `serverConfig` is not specified.

For the [Fastify Server options](https://www.fastify.io/docs/latest/Reference/Server/#factory) that you can set, see: https://www.fastify.io/docs/latest/Reference/Server/#factory.

Examples include: logger settings, timeouts, maximum payload limits, and more.

> **Note:** This configuration does not apply in a serverless deploy.

```js
// ./api/server.config.js
/**
 * This file allows you to configure the Fastify Server settings
 * used by the RedwoodJS dev server.
 *
 * It also applies when running the api server with `yarn rw serve`.
 *
 * For the Fastify server options that you can set, see:
 * https://www.fastify.io/docs/latest/Reference/Server/#factory
 *
 * Examples include: logger settings, timeouts, maximum payload limits, and more.
 *
 * Note: This configuration does not apply in a serverless deploy.
 */

/** @type {import('fastify').FastifyServerOptions} */
const config = {
  requestTimeout: 15_000,
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
}
```

You may elect to configure different `server.config.js` based on your deployment environment and take advantage of [# Using Environment Variables in redwood.toml](#using-environment-variables-in-redwoodtoml).

Given an environment variable `DEPLOY_ENVIRONMENT` that declares `developmnent`, `staging`, `production`:

```
[api]
  port = 8911
  serverConfig = = "./api/${DEPLOY_ENVIRONMENT}-server.config.js"
```

## [browser]

Configuration for the browser target.

| Key    | Description                                                       | Default | Context       |
| :----- | :---------------------------------------------------------------- | :------ | :------------ |
| `open` | Open the browser to web's `host:port` after the dev server starts | `false` | `development` |

### open

```toml
[browser]
  open = true
```

Setting `open` to `true` like this will open the browser to web's `host:port` (by default, localhost:8910) after the dev server starts. If you want your browser to stop opening when you `yarn rw dev`, set this to false. Or just remove it entirely.

You can also provide the name of a browser to use instead of the system default. E.g., `open = 'Firefox'` will open Firefox regardless of which browser's the default on your system.

> When you generate a new app, the `open` value is set to `true`. If you delete the `open` config from `redwood.toml`, it will default to `false`. For example, removing the line `open = true` disables automatic browser opening.

There's a lot more you can do here. For all the details, see Webpack's docs on [devServer.open](https://webpack.js.org/configuration/dev-server/#devserveropen).

## [generate]

```toml
[generate]
  tests = true
  stories = true
```

Configuration for Generator "test" and "story" files. By default, the following Generators create Jest test and/or Storybook files (with mock data files when applicable) along with specific component file(s): component, cell, layout, page, sdl, and services. Understandably, this is a lot of files, and sometimes you don't want all of them, either because you don't plan on using Jest/Storybook, or are just getting started and don't want the overhead. These toml keys allows you to toggle the generation of test and story files on and off.

| Key       | Description                    | Default |
| :-------- | :----------------------------- | :------ |
| `tests`   | Generate Jest test files       | `true`  |
| `stories` | Generate Storybook story files | `true`  |

### Tests

Setting to `true` creates tests when the generate command is invoked.

### Stories

Setting to `true` creates stories for [Storybook](https://storybook.js.org/) when the generate command is invoked.

## Running within a Container or VM

To run a Redwood app within a container or VM, you'll want to set both the web and api's `host` to `0.0.0.0` to allow network connections to and from the host:

```toml
[web]
  host = '0.0.0.0'
  ...
[api]
  host = '0.0.0.0'
  ...
```

## Using Environment Variables in `redwood.toml`

Sometimes you want to change your `redwood.toml` based on the environment you're deploying to.
For example, you may want to point to a different `apiUrl` in your staging environment.
You can do this with environment variables.
Let's look at an example:

```toml
[web]
  title = "App running on ${APP_TITLE}"
  port = "${PORT:8910}"
  apiUrl = "${API_URL:/.redwood/functions}"
  includeEnvironmentVariables = []
```

This does the following:

- sets `title` by interpolating the env var `APP_TITLE`
- sets `port` to the env var `PORT`, falling back to `8910`
- sets `apiUrl` to the env var `API_URL`, falling back to `/.redwood/functions` (the default)

That's pretty much all there is to it. Just remember two things:

1. fallbacks are always strings
2. these values are interpolated at _build_ time
