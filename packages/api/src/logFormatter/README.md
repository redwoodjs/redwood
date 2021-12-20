# LogFormatter

This package provides a way to format RedwoodJS Logger output in development.

It is based on [pino-colada](https://github.com/lrlna/pino-colada/blob/master/README.md): a cute [ndjson](http://ndjson.org) formatter for [pino](https://github.com/pinojs/pino).

Redwood-specific GraphQL log data included by the the `useRedwoodLogger` envelop plug-in is supported:

* Request Id
* User-Agent
* GraphQL Operation Name
* GraphQL Query
* GraphQL Data

## Usage

Pipe logs to the formatter:

```bash
yarn rw-api-server-watch | rw-log-formatter
yarn serve api | rw-log-formatter
```

Note: this is automatically setup in the `yarn rw dev` command.
