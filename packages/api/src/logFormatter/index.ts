import chalk from 'chalk'
import jsonParse from 'fast-json-parse'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

const newline = '\n'

const emojiLog: any = {
  warn: '⚠️',
  info: '✨',
  error: '🚨',
  debug: '🐛',
  fatal: '💀',
  trace: '🔍',
}

const isObject = (input: any) => {
  return Object.prototype.toString.apply(input) === '[object Object]'
}

const isEmptyObject = (object: any) => {
  return object && !Object.keys(object).length
}

const isPinoLog = (log: any) => {
  return log && Object.prototype.hasOwnProperty.call(log, 'level')
}
const isWideEmoji = (character: any) => {
  return character !== '⚠️'
}

export const LogFormatter = () => {
  const parse = (inputData: any) => {
    let logData
    if (typeof inputData === 'string') {
      const parsedData = jsonParse(inputData)
      if (!parsedData.value || parsedData.err || !isPinoLog(parsedData.value)) {
        return inputData + newline
      }
      logData = parsedData.value
    } else if (isObject(inputData) && isPinoLog(inputData)) {
      logData = inputData
    } else {
      return inputData + newline
    }

    if (!logData.level) {
      return inputData + newline
    }

    if (!logData.message) {
      logData.message = logData.msg
    }

    if (typeof logData.level === 'number') {
      convertLogNumber(logData)
    }

    return output(logData) + newline
  }

  const convertLogNumber = (logData: any) => {
    if (logData.level === 10) {
      logData.level = 'trace'
    }
    if (logData.level === 20) {
      logData.level = 'debug'
    }
    if (logData.level === 30) {
      logData.level = 'info'
    }
    if (logData.level === 40) {
      logData.level = 'warn'
    }
    if (logData.level === 50) {
      logData.level = 'error'
    }
    if (logData.level === 60) {
      logData.level = 'fatal'
    }
  }

  const output = (logData: any) => {
    const output = []

    if (!logData.level) {
      logData.level = 'customlevel'
    }

    if (!logData.name) {
      logData.name = ''
    }

    if (!logData.ns) {
      logData.ns = ''
    }

    output.push(formatDate(logData.time || Date.now()))
    output.push(formatLevel(logData.level))
    output.push(formatNs(logData.ns))
    output.push(formatName(logData.name))
    output.push(formatRequestId(logData.requestId))
    output.push(formatMessage(logData))

    const req = logData.req
    const res = logData.res
    const statusCode = res ? res.statusCode : logData.statusCode
    const responseTime = logData.responseTime || logData.elapsed
    const method = req ? req.method : logData.method
    const contentLength = logData.contentLength
    const operationName = logData.operationName
    const query = logData.query
    const graphQLData = logData.data
    const tracing = logData.tracing
    const url = req ? req.url : logData.url
    const userAgent = logData.userAgent
    const stack =
      logData.level === 'fatal' || logData.level === 'error'
        ? logData.stack || (logData.err && logData.err.stack)
        : null

    // Output err if it has more keys than 'stack'
    const err =
      (logData.level === 'fatal' || logData.level === 'error') &&
      logData.err &&
      Object.keys(logData.err).find((key) => key !== 'stack')
        ? logData.err
        : null

    if (method != null) {
      output.push(formatMethod(method))
      output.push(formatStatusCode(statusCode))
    }

    if (url != null) {
      output.push(formatUrl(url))
    }

    if (contentLength != null) {
      output.push(formatBundleSize(contentLength))
    }

    if (responseTime != null) {
      output.push(formatLoadTime(responseTime))
    }

    if (userAgent != null) {
      output.push(formatUserAgent(userAgent))
    }

    if (operationName != null) {
      output.push(formatOperationName(operationName))
    }

    if (query != null) {
      output.push(formatQuery(query))
    }

    if (graphQLData != null) {
      output.push(formatData(graphQLData))
    }

    if (tracing != null) {
      output.push(formatTracing(tracing))
    }

    if (stack != null) {
      output.push(formatStack(stack))
    }

    if (err != null) {
      output.push(formatErrorProp(err))
    }

    return output.filter(noEmpty).join(' ')
  }

  const formatBundleSize = (bundle: any) => {
    const bytes = parseInt(bundle, 10)
    const size = prettyBytes(bytes).replace(/ /, '')
    return chalk.gray(size)
  }

  const formatData = (data: any) => {
    if (!isEmptyObject(data)) {
      return chalk.blue(
        newline + '📦 Result Data' + newline + JSON.stringify(data, null, 2)
      )
    }

    return
  }

  const formatDate = (instant: Date) => {
    const date = new Date(instant)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const prettyDate = hours + ':' + minutes + ':' + seconds
    return chalk.gray(prettyDate)
  }

  const formatErrorProp = (errorPropValue: any) => {
    return newline + JSON.stringify({ err: errorPropValue }, null, 2)
  }

  const formatLevel = (level: any) => {
    const emoji = emojiLog[level]
    const padding = isWideEmoji(emoji) ? '' : ' '
    return emoji + padding
  }

  const formatLoadTime = (elapsedTime: any) => {
    const elapsed = parseInt(elapsedTime, 10)
    const time = prettyMs(elapsed)
    return chalk.gray(time)
  }

  const formatMessage = (logData: any) => {
    const msg = formatMessageName(logData.message)
    let pretty
    if (logData.level === 'error') {
      pretty = chalk.red(msg)
    }
    if (logData.level === 'trace') {
      pretty = chalk.white(msg)
    }
    if (logData.level === 'warn') {
      pretty = chalk.magenta(msg)
    }
    if (logData.level === 'debug') {
      pretty = chalk.yellow(msg)
    }
    if (logData.level === 'info' || logData.level === 'customlevel') {
      pretty = chalk.green(msg)
    }
    if (logData.level === 'fatal') {
      pretty = chalk.white.bgRed(msg)
    }
    return pretty
  }

  const formatMethod = (method: any) => {
    return chalk.white(method)
  }

  const formatRequestId = (requestId: any) => {
    return requestId && chalk.grey(requestId)
  }

  const formatNs = (name: any) => {
    return chalk.cyan(name)
  }

  const formatName = (name: any) => {
    return chalk.blue(name)
  }

  const formatMessageName = (message: any) => {
    if (message === 'request') {
      return '<--'
    }
    if (message === 'response') {
      return '-->'
    }
    return message
  }

  const formatOperationName = (operationName: any) => {
    return chalk.cyanBright(newline + '🩺 ' + operationName)
  }

  const formatQuery = (query: any) => {
    if (!isEmptyObject(query)) {
      return chalk.magenta(
        newline + '👀 Query' + newline + JSON.stringify(query, null, 2)
      )
    }

    return
  }

  const formatStatusCode = (statusCode: any) => {
    statusCode = statusCode || 'xxx'
    return chalk.white(statusCode)
  }

  const formatStack = (stack: any) => {
    return stack ? newline + stack : ''
  }

  const formatTracing = (data: any) => {
    console.log(data)
    if (!isEmptyObject(data)) {
      return chalk.cyanBright(newline + JSON.stringify(data, null, 2))
    }

    return
  }

  const formatUrl = (url: any) => {
    return chalk.white(url)
  }

  const formatUserAgent = (userAgent: any) => {
    return chalk.white(newline + '🕵️‍♀️ ' + userAgent)
  }

  const noEmpty = (value: any) => {
    return !!value
  }

  return parse
}
