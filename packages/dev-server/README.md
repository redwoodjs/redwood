# The Lambda DevServer

The dev server finds and serves lambda functions.

Each lambda function is mapped to a URI based on their filename, as
an example: `./api/src/functions/graphql.js` is accessible
at `http://localhost:8911/graphql`.

The `./api` directory is watched for modifications, when they are
detected the modules are reimported.

A lambda function must export a `handler`. You can execute the
supplied callback function to return a response:

```js
export const handler = (event, context, callback) => {
  return callback(null, { status: 200, body: 'Hello, world' })
}
``` -->
