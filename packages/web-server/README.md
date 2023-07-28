# Redwood's server for the Web side

## About

This package contains code for Redwood's Fastify Web side server:
- Used when running `yarn rw serve web`
- Used directly when doing Docker-based deploys

## package.json Server Binaries

Used to run the Redwood Fastify server for the Web side programmatically

From package.json
```
"bin": {
  "rw-web-server": "./dist/server.js"
},
```

### `rw-web-server`
Intended for dev and Docker-based deploys.

Not optimized for production use at scale on its own. Recommended to use CDN or
Nginx as performant alternatives. Or, at least along with a tool like PM2

- Runs web on redwood.toml web.port (default 8910)
- GraphQL endpoint is set to redwood.toml web.apiUrl/graphql
- Command Options:
    - port (default 8910)
    - socket (optional, overrides port if specified)
    - apiHost (should point to your api-side server)
