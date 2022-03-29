# Environment Variables

You can provide environment variables to each side of your Redwood app in different ways, depending on each side's target, and whether you're in development or production.

Redwood apps use [dotenv](https://github.com/motdotla/dotenv) to load vars from your `.env` file into `process.env`.
For a reference on dotenv syntax, see the dotenv README's [Rules](https://github.com/motdotla/dotenv#rules) section.

> Technically, we use [dotenv-defaults](https://github.com/mrsteele/dotenv-defaults), which is how we also supply and load `.env.defaults`.

<!-- also in a Redwood app's base directory. -->

Redwood also configures Webpack with `dotenv-webpack`, so that all references to `process.env` vars on the web side will be replaced with the variable's actual value at built-time. More on this in [web](#web).

## Web

### Including environment variables

> **Heads Up:** for Web to access environment variables in production, you _must_ configure one of the options below.
>
> Redwood recommends **Option 1: `redwood.toml`** as it is the most robust.

In production, you can get environment variables to the Web Side either by

1. adding to `redwood.toml` via the `includeEnvironmentVariables` array, or
2. prefixing with `REDWOOD_ENV_`

Just like for the API Side, you'll also have to set them up with your provider.

#### Option 1: includeEnvironmentVariables in redwood.toml

For Example:

```toml title="redwood.toml"
[web]
  includeEnvironmentVariables = ['SECRET_API_KEY', 'ANOTHER_ONE']
```

By adding environment variables to this array, they'll be available to Web in production via `process.env.SECRET_API_KEY`. This means that if you have an environment variable like `process.env.SECRET_API_KEY` Redwood removes and replaces it with its _actual_ value.

Note: if someone inspects your site's source, _they could see your `REDWOOD_ENV_SECRET_API_KEY` in plain text._ This is a limitation of delivering static JS and HTML to the browser.

#### Option 2: Prefixing with REDWOOD*ENV*

In `.env`, if you prefix your environment variables with `REDWOOD_ENV_`, they'll be available via `process.env.REDWOOD_ENV_MY_VAR_NAME`, and will be dynamically replaced at built-time.

Like the option above, these are also removed and replaced with the _actual value_ during build in order to be available in production.

### Accessing API URLs

Redwood automatically makes your API URL configurations from the web section of your `redwood.toml` available globally.
They're accessible via the `window` or `global` objects.
For example, `global.RWJS_API_GRAPHQL_URL` gives you the URL for your graphql endpoint.

The toml values are mapped as follows:

| `redwood.toml` key | Available globally as         | Description                              |
| ------------------ | ----------------------------- | ---------------------------------------- |
| `apiUrl`           | `global.RWJS_API_URL`         | URL or absolute path to your api-server  |
| `apiGraphQLUrl`    | `global.RWJS_API_GRAPHQL_URL` | URL or absolute path to GraphQL function |
| `apiDbAuthUrl`     | `global.RWJS_API_DBAUTH_URL`  | URL or absolute path to DbAuth function  |

See the [redwood.toml reference](app-configuration-redwood-toml.md#api-paths) for more details.

## API

Accessing environment variables on the api side is more straightforward.
They're on `process.env`.

Note that in production, whichever platform you deploy to, they'll have some specific way of making environment variables available to the serverless environment where your Functions run.
For example, if you deploy to Netlify, you set your environment variables in **Settings** > **Build & Deploy** > **Environment**.
You'll just have to read your provider's documentation.

## Keeping Sensitive Information Safe

Since it usually contains sensitive information, you should [never commit your `.env` file](https://github.com/motdotla/dotenv#should-i-commit-my-env-file).
Note that you'd actually have to go out of your way to do this as, by default, a Redwood app's `.gitignore` explicitly ignores `.env`:

```text title=".gitignore"
.DS_Store
// highlight-next-line
.env
.netlify
dev.db
dist
dist-babel
node_modules
yarn-error.log
```
