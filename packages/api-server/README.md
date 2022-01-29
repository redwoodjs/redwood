Redwood [Fastify](https://www.fastify.io) Server

## package.json Server Binaries

### `rw-serve`
Not intended for production use.
- Runs web on redwood.toml web.port (default 8910)
- API listens on web port at path redwood.toml web.apiUrl
- Command Options:
    - port (default 8910)
    - socket (optional)
    - apiHost (default redwood.toml web.apiUrl)

### `rw-server api` or `rw-api-server`
For production use.
- Runs api on redwood.toml api.port (default 8911)
- Command Options:
    - port (default 8911)
    - socket (optional)
    - apiRootPath (default '/')

### `rw-serve web`
Not optimized for production use. Recommended to use CDN or Nginx as performant alternatives.
- Runs web on redwood.toml web.port (default 8910)
- GraphQL endpoint is set to redwood.toml web.apiUrl/graphql
- Command Options:
    - port (default 8910)
    - socket (optional)
    - apiHost (default redwood.toml web.apiUrl)
