import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

const newline = '\n'

const emojiLog: Record<string, string> = {
  warn: '🚦',
  info: '🌲',
  error: '🚨',
  debug: '🐛',
  fatal: '💀',
  trace: '🧵',
}

const isObjectWithData = (object?: Record<string, unknown>) => {
  return object && Object.keys(object).length > 0
}

const isWideEmoji = (character: string) => {
  return character !== '🚦'
}

export const formatBundleSize = (bundleSize: string) => {
  const bytes = parseInt(bundleSize, 10)
  const size = prettyBytes(bytes).replace(/ /, '')
  return chalk.gray(size)
}

export const formatMetadata = (metadata?: Record<string, unknown>) => {
  return isObjectWithData(metadata)
    ? chalk.white(
        newline + '🗒  Metadata' + newline + JSON.stringify(metadata, null, 2)
      )
    : undefined
}

export const formatData = (data?: Record<string, unknown>) => {
  return isObjectWithData(data)
    ? chalk.white(
        newline + '📦 Result Data' + newline + JSON.stringify(data, null, 2)
      )
    : undefined
}

export const formatDate = (instant: number) => {
  const date = new Date(instant)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  const prettyDate = hours + ':' + minutes + ':' + seconds
  return chalk.gray(prettyDate)
}

export const formatLevel = (level: string) => {
  const emoji = emojiLog[level]
  const padding = isWideEmoji(emoji) ? '' : ' '
  return emoji + padding
}

export const formatLoadTime = (elapsedTime?: string) => {
  if (!elapsedTime) {
    return
  }

  const elapsed = Math.round(parseFloat(elapsedTime))
  const time = prettyMs(elapsed)

  return chalk.gray(time)
}

export const formatMessage = (logData: { msg?: string; level: string }) => {
  if (!logData.msg) {
    return
  }

  const msg = formatMessageName(logData.msg)

  switch (logData.level) {
    case 'error':
      return chalk.red(msg)
    case 'trace':
      return chalk.white(msg)
    case 'warn':
      return chalk.magenta(msg)
    case 'debug':
      return chalk.yellow(msg)
    case 'info':
    case 'customLevel':
      return chalk.green(msg)
    case 'fatal':
      return chalk.white.bgRed(msg)
  }

  return msg
}

export const formatMethod = (method: string) => {
  return chalk.white(method)
}

export const formatRequestId = (requestId?: string) => {
  return requestId && chalk.cyan(requestId)
}

export const formatNs = (name?: string) => {
  return name && chalk.cyan(name || '')
}

export const formatName = (name: string) => {
  return chalk.blue(name)
}

export const formatMessageName = (msg: string) => {
  if (msg === 'request') {
    return '<--'
  } else if (msg === 'response') {
    return '-->'
  }

  return msg
}

export const formatOperationName = (operationName?: string) => {
  return operationName && chalk.white(newline + '🏷  ' + operationName)
}

export const formatQuery = (query?: Record<string, unknown>) => {
  return isObjectWithData(query)
    ? chalk.white(
        newline + '🔭 Query' + newline + JSON.stringify(query, null, 2)
      )
    : undefined
}

export const formatResponseCache = (
  responseCache?: Record<string, unknown>
) => {
  return isObjectWithData(responseCache)
    ? chalk.white(
        newline +
          '💾 Response Cache' +
          newline +
          JSON.stringify(responseCache, null, 2)
      )
    : undefined
}

export const formatStatusCode = (statusCode?: string) => {
  statusCode = statusCode || 'xxx'
  return chalk.white(statusCode)
}

export const formatTracing = (data?: Record<string, unknown>) => {
  return isObjectWithData(data)
    ? chalk.white(
        newline + '⏰ Timing' + newline + JSON.stringify(data, null, 2)
      )
    : undefined
}

export const formatUrl = (url?: string) => {
  return url && chalk.white(url)
}

export const formatUserAgent = (userAgent?: string) => {
  return userAgent && chalk.grey(newline + '🕵️‍♀️ ' + userAgent)
}
