import { createLogger, defaultLoggerOptions } from '@redwoodjs/api/logger'

/**
 * Creates a logger. Options define how to log. Destination defines where to log.
 * If no destination, std out.
 */
export const logger = createLogger({
  options: { ...defaultLoggerOptions },
})

/*
 * Examples oh how to configure and
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
 * Datadog example
 */
// import datadog from 'pino-datadog'

// /**
//  * Creates a pino-logflare stream
//  *
//  * @param {string} apiKey - Your logFlare API Key
//  * @param {string} sourceToken - Your logFlare source token id
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
 * logFlare Example
 */
// import { createWriteStream } from 'pino-logflare'

// /**
//  * Creates a pino-logflare stream
//  *
//  * @param {string} apiKey - Your logFlare API Key
//  * @param {string} sourceToken - Your logFlare source token id
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
