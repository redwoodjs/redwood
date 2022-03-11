# Rename `timestamp` webhook verifier option

This codemod renames the `timestamp` webhook verifier option to `currentTimestampOverride`

The first thing it does is find all files that needs to be updated. We need to
look through all functions in the api/functions directory. In those functions
we're looking for calls to the `verifyEvent`, `verifySignature` or
`signPayload` functions.

A call can look like this:

```js
verifyEvent('timestampSchemeVerifier', {
  event,
  secret: process.env.STRIPE_WEBHOOK_SECRET,
  options,
})
```

Finally we need to find that `options` object and rename `timestamp` (if it
exists) to `currentTimestampOverride`
