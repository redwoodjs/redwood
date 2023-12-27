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
[notifications]
  versionUpdates = ["latest"]
```

These are listed by default because they're the ones that you're most likely to configure, but there are plenty more available.

The options and their structure are based on Redwood's notion of sides and targets. Right now, Redwood has two sides, api and web, that target Node.js Lambdas and browsers respectively. In the future, we'll add support for more sides and targets, and as we do, you'll see them reflected in `redwood.toml`.

> For the difference between a side and a target, see [Redwood File Structure](tutorial/chapter1/file-structure.md).

You can think of `redwood.toml` as a frontend for configuring Redwood's build tools.
For certain options, instead of having to deal with build tools configuration directly, there's quick access via `redwood.toml`.

## [web]

| Key                           | Description                                                | Default                 |
| :---------------------------- | :--------------------------------------------------------- | :---------------------- |
| `apiUrl`                      | The path or URL to your api-server                         | `"/.redwood/functions"` |
| `apiGraphQLUrl`               | The path or URL to your GraphQL function                   | `"${apiUrl}/graphql"`   |
| `apiDbAuthUrl`                | The path or URL to your dbAuth function                    | `"${apiUrl}/auth"`      |
| `a11y`                        | Enable storybook `addon-a11y` and `eslint-plugin-jsx-a11y` | `true`                  |
| `host`                        | Hostname to listen on                                      | `"localhost"`           |
| `includeEnvironmentVariables` | Environment variables to include                           | `[]`                    |
| `path`                        | Path to the web side                                       | `"./web"`               |
| `port`                        | Port to listen on                                          | `8910`                  |
| `sourceMap`                   | Enable source maps for production builds                   | `false`                 |
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

### Configure Fastify

You can configure the Fastify server instance in `api/server.config.js`.
For all the configuration options, see [Fastify's docs](https://www.fastify.io/docs/latest/Reference/Server/#factory).

:::info Where does this configuration apply?

This configuration does **not** apply in a serverless deploy.
Typically when you deploy to a serverless provider like Netlify or Vercel, your project's web side is served from a CDN, and functions are invoked directly.
But this configuration does apply when running:

| Command         | api  | web  |
| :-------------- | :--- | :--- |
| `yarn rw dev`   | ✅    | ❌    |
| `yarn rw serve` | ✅    | ✅    |

:::

Using redwood.toml's [env var interpolation](#using-environment-variables-in-redwoodtoml), you can change the server config used based on your deployment environment:

```toml title="redwood.toml"
[api]
  serverConfig = "./api/${DEPLOY_ENVIRONMENT}-server.config.js"
```

### Register Custom Fastify Plugins

You can register Fastify plugins for the api and web sides using the `configureFastify` function.
This function has access to the Fastify server instance and options, such as the side that's being configured.

:::warning Reminder

This configuration does **not** apply in a serverless deploy.

:::

```js
/** @type {import('@redwoodjs/api-server/dist/fastify').FastifySideConfigFn} */
const configureFastify = async (fastify, options) => {
  if (options.side === 'api') {
    fastify.log.trace({ custom: { options } }, 'Configuring api side')
  }

  if (options.side === 'web') {
    fastify.log.trace({ custom: { options } }, 'Configuring web side')
  }

  return fastify
}
```

#### How to configure a Fastify plugin for the api side

Let's say that you want to compress payloads and rate limit your API.
You can leverage two Fastify ecosystem plugins, [@fastify/compress](https://github.com/fastify/fastify-compress) and [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit) respectively.

Here, we configure compression so that it handles all requests, compresses responses only if they're larger than 1K, and to prefer the `deflate` method over `gzip`.
Using @fastify/rate-limit, we allow an IP address to only make 100 requests in a five minute window.

:::important Plugins need to be installed

You'll need to install plugin packages in your project's `api` workspace:

```
yarn workspace api add @fastify/rate-limit @fastify/compress
```

:::

```js
/** @type {import('@redwoodjs/api-server/dist/fastify').FastifySideConfigFn} */
const configureFastify = async (fastify, options) => {
  if (options.side === 'api') {
    fastify.log.trace({ custom: { options } }, 'Configuring api side')

    await fastify.register(import('@fastify/compress'), {
      global: true,
      threshold: 1_024,
      encodings: ['deflate', 'gzip'],
    })

    await fastify.register(import('@fastify/rate-limit'), {
      max: 100,
      timeWindow: '5 minutes',
    })
  }

  return fastify
}
```

#### How to Configure a Fastify plugin for the web side

If you're running the web side using `yarn rw serve`, you can configure plugins like [@fastify/etag](https://github.com/fastify/fastify-etag) to register HTTP Etags.

:::important Plugins need to be installed

You'll need to install plugin packages in your project's `api` workspace.
This may seem counter-intuitive, since you're configuring the `web` side, but the `api-server` gets configured in your project's `api` side and that's what's serving web assets.

:::

```js
/** @type {import('@redwoodjs/api-server/dist/fastify').FastifySideConfigFn} */
const configureFastify = async (fastify, options) => {
  if (options.side === 'web') {
    fastify.log.trace({ custom: { options } }, 'Configuring web side')

    fastify.register(import('@fastify/etag'))
  }

  return fastify
}
```

#### Troubleshooting Custom Fastify Configuration

There are a few important things to consider when configuring Fastify.

If running via `yarn rw serve`, only register a plugin once either in `api` or in `web`. Registering the same plugin in both sides will error saying that it has already been registered.

Running via `yarn rw serve` uses a single Fastify instance to serve both api functions and web assets, so registering the plugin in a single side applies it to that instance.

### How to Configure Fastify to Accept File Uploads

If you try to POST file content to the api server such as images or PDFs, you may see the following error from Fastify:

```json
{
    "statusCode": 400,
    "code": "FST_ERR_CTP_INVALID_CONTENT_LENGTH",
    "error": "Bad Request",
    "message": "Request body size did not match Content-Length"
}
```

This's because Fastify [only supports `application/json` and `text/plain` content types natively](https://www.fastify.io/docs/latest/Reference/ContentTypeParser/).
While Redwood configures the api server to also accept `application/x-www-form-urlencoded` and  `multipart/form-data`, if you want to support other content or MIME types (likes images or PDFs), you'll need to configure them yourself.

You can use Fastify's `addContentTypeParser` function to allow uploads of the content types your application needs.
For example, to support image file uploads you'd tell Fastify to allow `/^image\/.*/` content types:

```js
/** @type {import('@redwoodjs/api-server/dist/fastify').FastifySideConfigFn} */
const configureFastify = async (fastify, options) => {
  if (options.side === 'api') {
    fastify.log.trace({ custom: { options } }, 'Configuring api side')

    fastify.addContentTypeParser(/^image\/.*/, (req, payload, done) => {
      payload.on('end', () => {
        done()
      })
    })
  }

  return fastify
}
```

:::note

The above regular expression (`/^image\/.*/`) allows all image content or MIME types because [they start with "image"](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types).

:::

Now, when you POST those content types to a function served by the api server, you can access the file content on `event.body`:

```bash
curl --location --request POST 'http://localhost:8911/upload' \
  --form 'image=@"/path/to/my/image/web/public/favicon.png"' \
  --header 'Content-Type: image/png'
```

```terminal
api | 17:38:49 🌲 request completed 0ms
api | 17:38:49 🐛 body
api | 🗒 Custom
api | "--------------------------e66d9a27b7c2b271\r\nContent-Disposition: attachment; name=\"image\"; filename=\"favicon.png\"\r\nContent-Type: image/png\r\n\r\n�PNG\r\n\u001a\n\u0000\u0000\u0000\rIHDR\u0000\u0000\u0000 \u0000\u0000\u0000<data trimmed for docs...>`�\r\n--------------------------e66d9a27b7c2b271--\r\n"
```

:::caution File uploads only work in a serverful deploy

Serverless functions on Netlify or Vercel do not use this Fastify configuration.
They also have memory and execution time limits that don't lend themselves to handling file uploads of any practical size.

:::

## [browser]

```toml title="redwood.toml"
[browser]
  open = true
```

Setting `open` to `true` opens your browser to `${host}:${port}` (by default, `localhost:8910`) after the dev server starts.
If you want your browser to stop opening when you `yarn rw dev`, set this to false.
(Or just remove it entirely.)

There's actually a lot more you can do here. For more, see Vite's docs on [preview.open](https://vitejs.dev/config/preview-options.html#preview-open).

## [generate]

```toml title="redwood.toml"
[generate]
  tests = true
  stories = true
```

Many of Redwood's generators create Jest test or Storybook files.
Understandably, this can be lot of files, and sometimes you don't want all of them, either because you don't plan on using Jest or Storybook, or are just getting started and don't want the overhead.
These toml keys allows you to toggle the generation of test or story files.

## [cli]

```toml title="redwood.toml"
[notifications]
  versionUpdates = ["latest"]
```

There's new versions of the framework all the time—a major every couple months, a minor every week or two, and patches when appropriate.
And if you're on an experimental release line, like canary, there's new versions every day, multiple times.

If you'd like to get notified (at most, once a day) when there's a new version, set `versionUpdates` to include the version tags you're interested in within `redwood.toml`'s `notifications` table.

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
