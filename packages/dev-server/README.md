# Redwood's HTTP server for serverless Functions

The dev server looks for "lambda functions" in `./api/src/functions`.
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

## Request Handlers

At the moment we emulate AWS Lambda functions, but there are other serverless providers that have different request/ response signatures that we would like to support as a deploy target.

We think we have two approaches for making that possible:

- Converge on the AWS Lambda Functions format and convert "other" providers signatures at build time.
- Provide a way to emulate other function providers in the Redwood Function Server (Which is why this folder exists.)

We have not made a decision on which approach is better.