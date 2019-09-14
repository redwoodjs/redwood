# The Hammer Development Server

The hamer dev server looks for "lambda functions" in the directory (default: `./api/src/functions`) specified in your `hammer.toml` configuration file.

Each lambda function is mapped to a URI based on their filename, as
an example: `./api/src/functions/graphql.js` would be accessible
at `http://localhost:8911/graphql`.

A lambda function must export a handler to be valid:

```js
export const handler = (event, context, callback) => {
  return callback(null, { status: 200, body: 'Hello, world' })
}
```
