---
title: App Configuration
description: Configure your app with redwood.toml
---

# App Configuration: redwood.toml

You can configure your Redwood app in `redwood.toml`. By default, `redwood.toml` lists the following configuration options:

```toml title="redwood.toml"
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

These are listed by default because they're the ones that you're most likely to configure, but there are plenty more available.

The options and their structure are based on Redwood's notion of sides and targets. Right now, Redwood has two sides, api and web, that target Node.js Lambdas and browsers respectively. In the future, we'll add support for more sides and targets, and as we do, you'll see them reflected in `redwood.toml`.

> For the difference between a side and a target, see [Redwood File Structure](tutorial/chapter1/file-structure.md).

You can think of `redwood.toml` as a frontend for configuring Redwood's build tools.
For certain options, instead of having to deal with build tools like webpack directly, there's quick access via `redwood.toml`.

## [web]

| Key                           | Description                                                | Default                 |
| :---------------------------- | :--------------------------------------------------------- | :---------------------- |
| `apiUrl`                      | The path or URL to your api-server                         | `"/.redwood/functions"` |
| `apiGraphQLUrl`               | The path or URL to your GraphQL function                   | `"${apiUrl}/graphql"`   |
| `apiDbAuthUrl`                | The path or URL to your dbAuth function                    | `"${apiUrl}/auth"`      |
| `a11y`                        | Enable storybook `addon-a11y` and `eslint-plugin-jsx-a11y` | `true`                  |
| `fastRefresh`                 | Enable webpack's fast refresh                              | `true`                  |
| `host`                        | Hostname to listen on                                      | `"localhost"`           |
| `includeEnvironmentVariables` | Environment variables to include                           | `[]`                    |
| `path`                        | Path to the web side                                       | `"./web"`               |
| `port`                        | Port to listen on                                          | `8910`                  |
| `target`                      | Target for the web side                                    | `"browser"`             |
| `title`                       | Title of your Redwood app                                  | `"Redwood App"`         |

### Customizing the GraphQL Endpoint

By default, Redwood derives the GraphQL endpoint from `apiUrl` such that `./redwood/functions/graphql` ends up being the default graphql endpoint.
But sometimes you want to host your api side somewhere else, or even on a different domain.
There's two ways you can do this:

1. Change `apiUrl` to a different domain:

```toml title="redwood.toml"
[web]
  apiUrl = "https://api.coolredwoodapp.com"
```

Now the GraphQL endpoint is at `https://api.coolredwoodapp.com/graphql`.

2. Only change the GraphQL endpoint:

```diff title="redwood.toml"
[web]
  apiUrl = "/.redwood/functions"
+ apiGraphqlEndpoint = "https://coolrwapp.mycdn.com"
```

### Customizing the dbAuth Endpoint

If you're using dbAuth, you may decide to point its function at a different host.
To do this without affecting your GraphQL endpoint, you can add `apiDbAuthUrl` to your `redwood.toml`:

```diff title="redwood.toml"
[web]
  apiUrl = "/.redwood/functions"
+ apiDbAuthUrl = "https://api.mycoolapp.com/auth"
```

> If you point your web side to a different domain, please make sure you have [CORS headers](cors.md) configured.
> Otherwise browser security features may block requests from the client.

### includeEnvironmentVariables

`includeEnvironmentVariables` is the set of environment variables to include in the web side.
Use it to include environment variables you've defined in `.env`:

```toml title="redwood.toml"
[web]
  includeEnvironmentVariables = ["PUBLIC_KEY"]
```

```text title=".env"
PUBLIC_KEY=...
```

Instead of including them in `includeEnvironmentVariables`, you can also prefix them with `REDWOOD_ENV_` (see [Environment Variables](environment-variables.md#web)).

## [api]

| Key            | Description                         | Default                    |
| :------------- | :---------------------------------- | :------------------------- |
| `debugPort`    | Port to expose for the debugger     | `18911`                    |
| `host`         | Hostname to listen on               | `"localhost"`              |
| `path`         | Path to the api side                | `"./api"`                  |
| `port`         | Port to listen on                   | `8911`                     |
| `serverConfig` | Path to the `server.config.js` file | `"./api/server.config.js"` |
| `target`       | Target for the api side             | `"node"`                   |

### Fastify Server Configuration

You can configure the Fastify Server used by the dev server in `api/server.config.js`.
For all the configuration options, see the [Fastify Server docs](https://www.fastify.io/docs/latest/Reference/Server/#factory).

> This configuration doesn't apply in a serverless deploy

Using [redwood.toml's env var interpolation](#using-environment-variables-in-redwoodtoml), you can configure a different `server.config.js` based on your deployment environment:

```toml title="redwood.toml"
[api]
  serverConfig = "./api/${DEPLOY_ENVIRONMENT}-server.config.js"
```

## [browser]

```toml title="redwood.toml"
[browser]
  open = true
```

Setting `open` to `true` opens your browser to `${host}:${port}` (by default, `localhost:8910`) after the dev server starts.
If you want your browser to stop opening when you `yarn rw dev`, set this to false.
(Or just remove it entirely.)

There's actually a lot more you can do here. For more, see webpack's docs on [devServer.open](https://webpack.js.org/configuration/dev-server/#devserveropen).

## [generate]

```toml title="redwood.toml"
[generate]
  tests = true
  stories = true
```

Many of Redwood's generators create Jest test or Storybook files.
Understandably, this can be lot of files, and sometimes you don't want all of them, either because you don't plan on using Jest or Storybook, or are just getting started and don't want the overhead.
These toml keys allows you to toggle the generation of test or story files.

## Using Environment Variables in `redwood.toml`

You may find yourself wanting to change keys in `redwood.toml` based on the environment you're deploying to.
For example, you may want to point to a different `apiUrl` in your staging environment.

You can do so with environment variables.
Let's look at an example:

```toml title="redwood.toml"
[web]
  // highlight-start
  title = "App running on ${APP_TITLE}"
  port = "${PORT:8910}"
  apiUrl = "${API_URL:/.redwood/functions}"
  // highlight-end
  includeEnvironmentVariables = []
```

This `${<envVar>:[fallback]}` syntax does the following:

- sets `title` by interpolating the env var `APP_TITLE`
- sets `port` to the env var `PORT`, falling back to `8910`
- sets `apiUrl` to the env var `API_URL`, falling back to `/.redwood/functions` (the default)

That's pretty much all there is to it.
Just remember two things:

1. fallback is always a string
2. these values are interpolated at build time

## Running in a Container or VM

To run a Redwood app in a container or VM, you'll want to set both the web and api's `host` to `0.0.0.0` to allow network connections to and from the host:

```toml title="redwood.toml"
[web]
  host = '0.0.0.0'
[api]
  host = '0.0.0.0'
```
