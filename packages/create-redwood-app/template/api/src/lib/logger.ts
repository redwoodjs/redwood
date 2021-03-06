import { createLogger, defaultLoggerOptions } from '@redwoodjs/api/logger'

/**
 * Creates a logger. Options define how to log. Destination defines where to log.
 * If no destination, std out.
 */
export const logger = createLogger({
  options: { ...defaultLoggerOptions },
})

/*
 * Examples of how to configure and
 * send to log transport streams
/*

/**
 * Override log level
 */
// export const logger = createLogger({
//   options: { ...defaultLoggerOptions, level: 'warn' },
// })

/**
 * Always pretty print
 */
// export const logger = createLogger({
//   options: { ...defaultLoggerOptions, prettyPrint: 'true' },
// })

/**
 * Custom redaction list
 */
// import { redactionsList } from '@redwoodjs/api/logger'
// export const logger = createLogger({
//   options: { ...defaultLoggerOptions, redact: [...redactionsList, 'my_secret_key'] },
// })

/**
 * Log to a File
 */
// export const logger = createLogger({
//   options: { ...defaultLoggerOptions, file: '/path/to/file'},
// })

/**
 * Stream logs to Datadog
 */
// import datadog from 'pino-datadog'
// /**
//  * Creates a synchronous pino-datadog stream
//  *
//  * @param {object} options - Datadog options including your account's API Key
//  *
//  * @typedef {DestinationStream}
//  */
// export const stream = datadog.createWriteStreamSync({
//   apiKey: process.env.DATADOG_API_KEY,
//   ddsource: 'my-source-name',
//   ddtags: 'tag,not,it',
//   service: 'my-service-name',
//   size: 1,
// })

// export const logger = createLogger({
//   options: { ...defaultLoggerOptions, destination: stream},
// })

/**
 * Stream logs to logFlare
 */
// import { createWriteStream } from 'pino-logflare'

// /**
//  * Creates a pino-logflare stream
//  *
//  * @param {object} options - logFlare options including
//  * your account's logFlare API Key and source token id
//  *
//  * @typedef {DestinationStream}
//  */
// export const stream = createWriteStream({
//   apiKey: process.env.LOGFLARE_API_KEY,
//   sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
// })

// export const logger = createLogger({
//   options: { ...defaultLoggerOptions, destination: stream},
// })
