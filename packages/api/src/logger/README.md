# Logger

RedwoodJS provides an opinionated logger with sensible, practical defaults that grants you visibility into the JAMStack applications you're developing and have deployed  -- with ease.

Logging in the serverless ecosystem is not trivial and neither is its configuration.

When choosing a Node.js logger to add to the framework, RedwoodJS required that it:

* Have a low-overhead, and be fast
* Output helpful, readable information in development
* Be highly configurable to set log levels, time formatting, and more
* Support key redaction to prevent passwords or tokens from leaking out
* Save to a file in local (or other) environments that can write to the file system
* Stream to third-party log and application monitoring services vital to production logging in serverless environments like [logFlare](https://logflare.app/) and [Datadog](https://www.datadoghq.com/)
* Hook into [Prisma logging](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging) to give visibility into connection issues, slow queries, and any unexpected errors
* Have a solid Developer experience (DX) to get logging out-of-the-gate quickly
* Use a compact configuration to set how to log (its `options`) and where to log -- file, stdout, or remote transport stream -- (its `destination`)

With those criteria in mind, Redwood includes [pino](https://github.com/pinojs/pino) with its rich [features](https://github.com/pinojs/pino/blob/master/docs/api.md), [ecosystem](https://github.com/pinojs/pino/blob/master/docs/ecosystem.md) and [community](https://github.com/pinojs/pino/blob/master/docs/ecosystem.md#community).

Plus ... pino means 🌲 pine tree! How perfect is that for RedwoodJS?

Note: RedwoodJS logging is setup for its api side only. For browser and web side error reporting or exception handling, these features will be addressed in a future release.

## Quick Start

To start 🌲🪓 api-side logging, just

* import the logger in your service, function, or any other lib
* use `logger` with the level just as you might have with `console`

```js
// api/lib/logger.ts

import { createLogger } from '@redwoodjs/api/logger'

/**
 * Creates a logger. Options define how to log. Destination defines where to log.
 * If no destination, std out.
 */
export const logger = createLogger({})

// then, in your api service, lib, function file
import { logger } from 'src/lib/logger'

//...

logger.trace(`>> items service -> About to save item ${item.name}`)
logger.info(`Saving item ${item.name}`)
logger.debug({ item }, `Item ${item.name} detail`)
logger.warn(item, `Item ${item.id} is missing a name`)
logger.warn({ missing: { name: item.name } }, `Item ${item.id} is missing values`)
logger.error(error, `Failed to save item`)
```

That's it!

### Manual Setup for RedwoodJS Upgrade

If you are upgrading an existing RedwoodJS app and would like to include logging, you simply need to copy over files from the "Create Redwood Application" template:

* Copy `packages/create-redwood-app/template/api/src/lib/logger.ts` to `api/lib/logger.ts`. Required.

For optional Prisma logging:

* Copy `packages/create-redwood-app/template/api/src/lib/db.ts` to `api/lib/db.ts`. Optional.
* Copy `packages/create-redwood-app/template/api/src/lib/prisma.ts` to `api/lib/prisma.ts`. Optional.

The first file `logger.ts` defines the logger instance. You will import `logger` and use in your services, functions or other libraries. You may then replace existing `console.log()` statements with `logger.info()` or `logger.debug()`.

The second set of files `db.ts` and `prisma.ts` -- which are optional -- replace how the `db` Prisma client instance is declares and exported. It configures Prisma logging, if desired. See below for more information of Prisma logging options.

## Options aka How to Log

In addition to the rich [features](https://github.com/pinojs/pino/blob/master/docs/api.md) that [pino](https://github.com/pinojs/pino) offers, RedwoodJS has added some sensible, practical defaults to make the logger DX first-rate.

### Log Level

The logger detects you current environment and will default an appropriate minimum log level.

In Development, the default is `trace` while in Production, the default is `warn`.

This means that output in your dev server can be verbose, but when you deploy you won't miss out on critical issues.

You can override the default log level via the `LOG_LEVEL` environment variable.

### Redaction

Everyone has herd or reports that Company X logged emails, or passwords to files or systems that may not have been secured. While RedwoodJS logging won't necessarily prevent that, it does provide you with the mechanism to ensure that won't happen.

To redact sensitive information, you can supply paths to keys that hold sensitive data using the [redact option](https://github.com/pinojs/pino/blob/master/docs/redaction.md).

We've included a default set called the `redactionList` that includes keys such as

```
  'access_token',
  'accessToken',
  'DATABASE_URL',
  'email',
  'event.headers.authorization',
  'host',
  'jwt',
  'JWT',
  'password',
  'secret',
```

You may wish to augment these defaults via the `redact` configuration setting, here adding a Social Security Number and Credit Card Number key to the list.

```js
/**
 * Custom redaction list
 */
import { redactionsList } from '@redwoodjs/api/logger'

//...

export const logger = createLogger({
  options: { redact: [...redactionsList, 'ssn,credit_card_number'] },
})
```
Note: Unless you provide the current `redactionsList` with the defaults, just the keys `'ssn,credit_card_number'` will be redacted.

### Pretty Printing

No logging is worth logging if you cannot read it.

We've turned on pretty printing in development to add color, time formatting, level reporting so that one can quickly see what is going on.

We'll turn this off in production, since RedwoodJS will send the logs formatted as NDJSON (or transformed into the the format your transport requires) to your log or application monitoring service to process, store and display.

### Nested Logging

Since you can log metadata information alongside your message as seen in:

```js
logger.debug({ item }, `Item ${item.name} detail`)
logger.warn(item, `Item ${item.id} is missing a name`)
logger.warn({ missing: { name: item.name } }, `Item ${item.id} is missing values`)
logger.error(error, `Failed to save item`)
```

There could be cases where a key in that metadata collides with a key needed by pino or your third-party transport.

To prevent collisions and overwriting values, you can nest your metadata in an `log` or `payload` or some other attribute.

```js
nestedKey: 'log',
```

Note: If you use `nestedKey` logging, you will have to manually set any `redact` options to include the `nestedKey` values as a prefix.

For example, if your nestedKey is `'log`, then instead of redacting `email` you will have to redact `log.email`.

### Destination aka Where to Log

The `destination` option allows you to specify where to send the api-side log statements: to standard output, file, or transport stream.

### Dev Server

When in your development environment, logs will be output to the dev servers standard output.

### Log to File

If in your development environment or another environment in which you have write access to the filesystem, can can set the `destination` to the location of your file.

Note: logging to a file is not permitted if deployed to Netlify or Vercel.

```js
/**
 * Log to a File
 */
export const logger = createLogger({
  options: { ...defaultLoggerOptions },
  destination: '/path/to/file/api.log',
})
```

#### Transport Streams

Since each serverless function is ephemeral, its logging output is, too. Unless you monitor that function log just at the right time, you'll miss critical warnings, errors, or exceptions.

It's recommended then to log to a "transport" stream when deployed to production so that logs are stored and searchable.

Pino offers [several transports](https://github.com/pinojs/pino/blob/HEAD/docs/transports.md#known-transports) that can send your logs to a remote destination. A ["transport"](https://github.com/pinojs/pino/blob/HEAD/docs/transports.md) for pino is a supplementary tool which consumes pino logs.

See below for examples of how to configure Logflare and Datadog.

Note that not all [known pino transports](https://github.com/pinojs/pino/blob/HEAD/docs/transports.md#known-transports) can be used in a serverless environment.

## Default Configuration Overview

RedwoodJS provides an opinionated logger with sensible, practical defaults. These include:

 * Colorize output when pretty printing
 * Ignore certain event attributes like hostname and pid for cleaner log statements
 * Prefix the log output with log level
 * Use a shorted log message that omits server name
 * Humanize time in GMT
 * Set the default log level in dev or test to trace
 * Set the default log level warn in prod
 * Note you may override the default log level via the LOG_LEVEL environment variable
 * Nest objects under an `api` key to avoid conflicts with pino properties
 * Redact the host and other keys via a set redactionList

## Configuration Examples

Some examples of common configurations and overrides demonstrate how you can have control over both how and where you log.
### Override Log Level

You can set the minimum level to log via the `level` option.

```js
/**
 * Override minimum log level to warn
 */
export const logger = createLogger({
  options: { level: 'warn' },
})
```
### Always Pretty Print

In the situation where you want to force pretty printing even in Production, you can set the `prettyPrint` option to `true`.

```js
/**
 * Always pretty print
 */
export const logger = createLogger({
  options: { prettyPrint: 'true' },
})
```

### Customize a Redactions List

While the logger provides default redaction list, you can specify additions keys to redact by either appending them to the list or setting the `redact` option to a new array of keys.

Please see [pino's redaction documentation](https://github.com/pinojs/pino/blob/master/docs/redaction.md) for other `redact` options, such as removing both keys and values and path matching.

```js
/**
 * Customize a redactions list to add `my_secret_key`
 */
import { redactionsList } from '@redwoodjs/api/logger'

export const logger = createLogger({
  options: { redact: [...redactionsList, 'my_secret_key'] },
})
```

### Log to a Physical File

If in your development environment or another environment in which you have write access to the filesystem, can can set the `destination` to the location of your file.

Note: logging to a file is not permitted if deployed to Netlify or Vercel.

```js
/**
 * Log to a File
 */
export const logger = createLogger({
  options: { ...defaultLoggerOptions },
  destination: '/path/to/file/api.log',
})
```

### Log to Datadog using a Transport Stream Destination

To stream your logs to [Datadog](https://www.datadoghq.com/), you can

* Install the [`pino-datadog`](https://www.npmjs.com/package/pino-datadog) package into `api`
* Import `pino-datadog`
* Configure the `stream` with your API key and [settings](https://github.com/ovhemert/pino-datadog/blob/master/docs/API.md)
* Set the logger `destination` to the `stream`

```js
/**
 * Stream logs to Datadog
 */
 import datadog from 'pino-datadog'
 /**
  * Creates a synchronous pino-datadog stream
  *
  * @param {object} options - Datadog options including your account's API Key
  *
  * @typedef {DestinationStream}
  */
 export const stream = datadog.createWriteStreamSync({
   apiKey: process.env.DATADOG_API_KEY,
   ddsource: 'my-source-name',
   ddtags: 'tag,not,it',
   service: 'my-service-name',
   size: 1,
 })

// ...

export const logger = createLogger({
   options: { ...defaultLoggerOptions,
   destination: stream},
})
```

### Log to Logflare using a Transport Stream Destination

* Install the [`pino-logflare`](https://www.npmjs.com/package/pino-logflare) package into `api`
* Import `pino-logflare`
* Configure the `stream` with your [API key and sourceToken](https://github.com/Logflare/pino-logflare/blob/master/docs/API.md)
* Set the logger `destination` to the `stream`


```js
import { createWriteStream } from 'pino-logflare'

/**
 * Creates a pino-logflare stream
 *
 * @param {object} options - Logflare options including
 * your account's API Key and source token id
 *
 * @typedef {DestinationStream}
 */
export const stream = createWriteStream({
  apiKey: process.env.LOGFLARE_API_KEY,
  sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
})

export const logger = createLogger({
  options: { ...defaultLoggerOptions,
  destination: stream},
})
```

### Prisma Logging

Redwood declares an instance of the PrismaClient

Prisma is configured to log at the:

* info
* warn
* error

levels.

One may also log *every* query by adding the `query` level to the `defaultLogLevels`.

If you wish to remove `info` logging, then you can define a set of levels, such as `['warn', 'error']`.

```js
export const db = createPrismaClient([...defaultLogLevels, 'query'])
```

See: The Prisma Client References documentation on [Logging](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#log).


#### Slow Queries

If `query` Prisma level logging is enabled and the `debug` level is enabled on the Logger then all query statements will be logged.

Otherwise any query exceeding a threshold duration will be logged an the `warn` level.

The duration is defined in `prisma.ts`:

```js
const SLOW_QUERY_THRESHOLD = 2_000 // 2 seconds
```

### Advanced Use

There are situations when you may wish to add information to every log statement.

This may be accomplished via [child loggers](https://github.com/pinojs/pino/blob/master/docs/child-loggers.md).

#### GraphQL Service / Event Logger

TODO
#### Child Loggers

```js
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const userExamples = ({}, { info }) => {
  const childLogger = logger.child({ path: info.fieldName })
  childLogger.trace('I am in find many user examples resolver')
  return db.userExample.findMany()
}

export const userExample = async ({ id }, { info }) => {
  const childLogger = logger.child({ id, path: info.fieldName })
  childLogger.trace('I am in the find a user example by id resolver')
  const result = await db.userExample.findUnique({
    where: { id },
  })

  childLogger.debug({ ...result }, 'This is the detail for the user')

  return result
}
```

See: [Child Loggers](https://github.com/pinojs/pino/blob/master/docs/child-loggers.md)
