# Redwood Front-end Server

## About

This package contains code for Redwood's Fastify Front-end server:
- Used when running `yarn rw serve web`
- Used directly when doing Docker-based deploys

#### TODO
- add code structure walk-through
- add package leads
- add contributing related info

## package.json Server Binaries

Used to run the Redwood Fastify Front-end Server programmatically

From package.json
```
"bin": {
  "rw-fe-server": "./dist/server.js"
},
```

### `rw-fe-server`
Intended for dev and Docker-based deploys.

Not optimized for production use at scale on its own. Recommended to use CDN or
Nginx as performant alternatives. Or, at least along with a tool like PM2

- Runs web on redwood.toml web.port (default 8910)
- GraphQL endpoint is set to redwood.toml web.apiUrl/graphql
- Command Options:
    - port (default 8910)
    - socket (optional, overrides port if specified)
    - apiHost (default redwood.toml web.apiUrl)
