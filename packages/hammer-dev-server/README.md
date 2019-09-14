# HammerFramework

## hammer-dev-server

This is the hammer dev server. It looks for "lambda functions" in the
`./api/src/functions` directory and serves them.

The filename is mapped to a URI, as an example `hello.js` would be
served as `https://localhost:8911/hello`.

At the moment they emulate the AWS lambda function definition.

```js
export const handler = (event, context, callback) => {
  return callback(null, { status: 200, body: "Hello, world" });
};
```
