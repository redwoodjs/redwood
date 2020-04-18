# Environmental Variables

You can provide environmental variables to each side of your Redwood project in different ways, and depending on your target.

## API
On the api side with NodeJS as your target you can add access the environmental variables defined in your `.env` and `.env.defaults` file.

## WEB
On the web side with webpack as your target you can do one of three things:

1. Prefix your env vars with `REDWOOD_ENV_` and they will be available via `process.env.REDWOOD_ENV_MY_VAR_NAME`
2. Whitelist them in your `redwood.toml`:
```toml

[web]
  includeEnvironmentVariables = ['API_KEY']
```
3. Define them in your `.env` file
