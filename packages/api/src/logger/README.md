# Logger

RedwoodJS provides an opinionated logger with sensible, practical defaults that grants you visibility into the JAMstack applications you're developing and have deployed  -- with ease.

Logging in the serverless ecosystem is not trivial and neither is its configuration.

When choosing a Node.js logger to add to the framework, RedwoodJS required that it:

* Have a low-overhead, and be fast
* Output helpful, readable information in development
* Be highly configuirable to set log levels, time formatting, and more
* Support key redaction to prevent passwords or tokens from leaking out
* Save to a file in local (or other) environmesnts that can write to the file system
* Stream to third-party log and application monitoring services vital to production logging in serverless environments like [logFlare](https://logflare.app/) and [Datadog](https://www.datadoghq.com/)
* Hook into [Prisma logging](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging) to give visibility into connection issues, slow queries, and any unexpected errors
* Have a solid Developer experience (DX) to get logging out-of-the-gate quickly
* Use a compact configuration to set how to log (its `options`) and where to log -- file, stdout, or remote transport stream -- (its `destination`)

With those criteria in mind, Redwood includes [pino](https://github.com/pinojs/pino) with its rich [features](https://github.com/pinojs/pino/blob/master/docs/api.md), [ecosystem](https://github.com/pinojs/pino/blob/master/docs/ecosystem.md) and [community](https://github.com/pinojs/pino/blob/master/docs/ecosystem.md#community).

Plus ... pino means 🌲 pine tree! How perfect is that for RedwoodJS?

Note: RedwoodJS logging is setup for its api side only. For browser and web side error reporting or exception handling, these features will be addressed in a future release.

## Quick Start

To start api-side logging, just

* import the logger in your service, function, or any other lib
* use `logger` with the level just as you might have with `console`

```js
import { logger } from 'src/lib/logger'

logger.trace(`>> items service -> About to save item ${item.name}`)
logger.info(`Saving item ${item.name}`)
logger.debug({ item }, `Item ${item.name} detail`)
logger.warn(item, `Item ${item.id} is missing a name`)
logger.warn({ missing: { name: item.name } }, `Item ${item.id} is missing values`)
logger.error(error, `Failed to save item`)
```

That's it!

## Features

In addition to the rich [features](https://github.com/pinojs/pino/blob/master/docs/api.md) that [pino](https://github.com/pinojs/pino) offers, RedwoodJS has added some sensible, practical defaults to make the logger DX first-rate.

### Log Level

The logger detects you current environment and will default an apporiate minumum log level.

In Development, the default is `trace` while in Production, the default is `warn`.

This means that output in your dev server can be verbose, but when you deploy you won't miss out on critical issues.

### Redaction

Everyone has herd or reports that Company X logged emails, or passwords to files or systems that may not have been secured. While RedwoodJS logging won't necessarily prevent that, it does provide you with the mechanism to ensure that won't happen.

To redact sensitive information, you can supply paths to keys that hold sensitive data using the [redact option](https://github.com/pinojs/pino/blob/master/docs/redaction.md).

We've included a default set called the `redactionList` that includes keys such as

```
'email',
'accessToken',
'access_token',
'secret',
'password',
```

You may wish to augment these defaults via the `redact` configuration setting, here adding a Social Security Number and Credit Card Number ket to the list.

```js
/**
 * Custom redaction list
 */
import { redactionsList } from '@redwoodjs/api/logger'
...
export const logger = createLogger({
  options: { ...defaultLoggerOptions, redact: [...redactionsList, 'ssn,credit_card_number'] },
})
```

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

There could be cases where a key in that metadata colides with a key needed by pino or your thirs-party transport.

To prevent collisions and overwriting values, we nest your metadata in a `log` attribute by default.

One can of course override this default in by setting a different `nestedKey` value when configuring the logger options:

```js
nestedKey: 'log',
```

### Transport Streams

Since each serverless function is ephemeral, its logging output is, too. Unless you monitor that funciton log just at the right time, you'll miss critical warnings, errors, or exceptions.



### Log to File

### Prisma Logging

## Defaults

### Recommendations

## Transport Streams

## Manual Setup for RedwoodJS Upgrade

* copy files

## Examples

## logger not console


## Future

### GraphQL Context

### Enhancements

#### Debug

https://github.com/pinojs/pino/blob/master/docs/help.md#pino-with-debug
