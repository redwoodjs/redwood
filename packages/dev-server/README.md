# Redwood's HTTP server for serverless Functions

The dev server looks for "lambda functions" in the directory
(default: `./api/src/functions`) specified by your `redwood.toml`
configuration file.

Each lambda function is mapped to a URI based on their filename, as
an example: `./api/src/functions/graphql.js` would be accessible
at `http://localhost:8911/graphql`.

The `./api` directory is watched for modifications, when they are
detected the modules are reimported.

A lambda function must export a `handler`. You can execute the
supplied callback function to return a response:

```js
export const handler = (event, context, callback) => {
  return callback(null, { status: 200, body: 'Hello, world' })
}
```
