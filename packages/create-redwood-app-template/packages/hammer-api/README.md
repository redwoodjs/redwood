# Hammer-API

## What's inside?

### graphQL serverless function

```js
// api/src/functions/graphql
import { graphQLServerlessFunction } from '@hammerframework/hammer'

const server = graphQLServerlessFunction({
    schemaTypes: [],
    context:  {
        photon: /* ... */,
        currentUser: /* ... */,
    },
})

export const handler = server.createHandler();
```
