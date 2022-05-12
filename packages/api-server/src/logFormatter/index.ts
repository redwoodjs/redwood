import jsonParse from 'fast-json-parse'

import { DEFAULT_API_SERVER_LOGGER_NAME } from '../app'

import {
  formatOperationName,
  formatQuery,
  formatData,
  formatResponseCache,
  formatLoadTime,
  formatDate,
  formatNs,
  formatName,
  formatRequestId,
  formatMessage,
  formatTracing,
  formatUserAgent,
  formatMethod,
  formatUrl,
  formatStatusCode,
  formatMetadata,
  formatLevel,
  formatBundleSize,
} from './formatters'

const newline = '\n'

const isPinoLog = (log?: unknown) => {
  return log && Object.prototype.hasOwnProperty.call(log, 'level')
}

export const LogFormatter = () => {
  /**
   * Example inputData:
   *   {
   *     "level": 20,
   *     "time": 1650298442951,
   *     "pid": 80980,
   *     "hostname": "Tobbes-MacBook-Pro.local",
   *     "foo": "foo",
   *     "nested": {
   *       "arr": [
   *         "one",
   *         "two",
   *         "three"
   *       ]
   *     },
   *     "msg": "Example debug log"
   *   }
   *
   *   {
   *     "level": 20,
   *     "time": 1651913678887,
   *     "pid": 83106,
   *     "hostname": "Tobbes-MacBook-Pro.local",
   *     "name": "rw-graphql-server",
   *     "operationName": "BlogPostsQuery",
   *     "query": {},
   *     "requestId": "req-4",
   *     "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.147 Safari/537.36",
   *     "data": {
   *       "blogPosts": [
   *         {
   *           "id": 1,
   *           "title": "A little more about me",
   *           "body": "Raclette shoreditch ...",
   *           "createdAt": "2022-05-07T07:41:21.150Z",
   *           "__typename": "Post"
   *         },
   *         {
   *           "id": 2,
   *           "title": "What is the meaning of life?",
   *           "body": "Meh waistcoat succulents ...",
   *           "createdAt": "2022-05-07T07:41:21.150Z",
   *           "__typename": "Post"
   *         },
   *         {
   *           "id": 3,
   *           "title": "Welcome to the blog!",
   *           "body": "I'm baby single- origin ...",
   *           "createdAt": "2022-05-07T07:41:21.150Z",
   *           "__typename": "Post"
   *         }
   *       ]
   *     },
   *     "responseCache": {
   *       "hit": false,
   *       "didCache": true,
   *       "ttl": null
   *     },
   *     "msg": "GraphQL execution completed: BlogPostsQuery"
   *   }
   */
  const parse = (inputData: string | Record<string, unknown>) => {
    let logData

    if (typeof inputData === 'string') {
      const parsedData = jsonParse(inputData)

      // `value` and `err` here comes from jsonParse above
      if (!parsedData.value || parsedData.err || !isPinoLog(parsedData.value)) {
        return inputData + newline
      }

      logData = parsedData.value
    } else if (isPinoLog(inputData)) {
      // We only end up in here in our tests
      logData = inputData
    } else {
      return inputData + newline
    }

    if (!logData.level) {
      return inputData + newline
    }

    if (typeof logData.level === 'number') {
      logData.level = convertLogNumber(logData)
    }

    return output(logData) + newline
  }

  const convertLogNumber = (logData: { level: number }) => {
    const levelMap: Record<number, string> = {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal',
    }

    return levelMap[logData.level] || 'customLevel'
  }

  const noEmpty = (value: string | undefined) => {
    return !!value
  }

  interface GraphqlServerLogs {
    level: string
    name: string
    msg: string
    operationName?: string
    query?: Record<string, unknown>
    requestId?: string
    userAgent?: string
    data?: Record<string, unknown>
    responseCache?: Record<string, unknown>
    tracing?: Record<string, unknown>
  }

  function isGraphqlServerLogs(
    logData: Record<string, unknown> | GraphqlServerLogs
  ): logData is GraphqlServerLogs {
    return (
      (logData as unknown as GraphqlServerLogs).name === 'rw-graphql-server'
    )
  }

  /**
   * Example logData
   * {
   *   level: 'debug',
   *   time: 1651911200534,
   *   pid: 81356,
   *   hostname: 'Tobbes-MacBook-Pro.local',
   *   name: 'rw-graphql-server',
   *   msg: 'GraphQL execution started: BlogPostsQuery',
   * }
   *
   * {
   *   level: 'debug',
   *   time: 1651911200547,
   *   pid: 81356,
   *   hostname: 'Tobbes-MacBook-Pro.local',
   *   name: 'rw-graphql-server',
   *   msg: 'GraphQL execution completed: BlogPostsQuery',
   * }
   *
   * With more logging options enabled in graphql.ts
   * {
   *   level: 'debug',
   *   time: 1651911945301,
   *   pid: 82077,
   *   hostname: 'Tobbes-MacBook-Pro.local',
   *   name: 'rw-graphql-server',
   *   operationName: 'BlogPostsQuery',
   *   query: {},
   *   requestId: 'req-8',
   *   userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.147 Safari/537.36',
   *   data: { blogPosts: [ [Object], [Object], [Object] ] },
   *   responseCache: { hit: false, didCache: true, ttl: null },
   *   msg: 'GraphQL execution completed: BlogPostsQuery',
   * }
   */
  const outputGraphqlServer = (logData: GraphqlServerLogs) => {
    const output: (string | undefined)[] = []

    output.push(formatName(logData.name))
    output.push(formatRequestId(logData.requestId))
    output.push(formatMessage(logData))
    output.push(formatOperationName(logData.operationName))
    output.push(formatQuery(logData.query))
    output.push(formatData(logData.data))
    output.push(formatResponseCache(logData.responseCache))
    output.push(formatTracing(logData.tracing))
    output.push(formatUserAgent(logData.userAgent))

    return output
  }

  interface ApiServerLogs {
    level: string
    name: string
    req?: Record<string, string>
    res?: Record<string, string>
    statusCode?: string
    responseTime?: string
    elapsed?: string
    method?: string
    contentLength?: string
    url?: string
    msg: string
  }

  function isApiServerLogs(
    logData: Record<string, unknown> | ApiServerLogs
  ): logData is ApiServerLogs {
    return (
      (logData as unknown as ApiServerLogs).name ===
      DEFAULT_API_SERVER_LOGGER_NAME
    )
  }

  /**
   * Example logData
   *
   * {
   *   level: 'info',
   *   time: 1651910010935,
   *   pid: 80419,
   *   hostname: 'Tobbes-MacBook-Pro.local',
   *   name: 'api-server',
   *   reqId: 'req-7',
   *   res: { statusCode: 200 },
   *   responseTime: 4.725124835968018,
   *   msg: 'request completed',
   * }
   *
   * {
   *   level: 'info',
   *   time: 1651910010930,
   *   pid: 80419,
   *   hostname: 'Tobbes-MacBook-Pro.local',
   *   name: 'api-server',
   *   reqId: 'req-7',
   *   req: {
   *     method: 'POST',
   *     url: '/graphql',
   *     hostname: 'localhost:8910',
   *     remoteAddress: '::1',
   *     remotePort: 64980
   *   },
   *   msg: 'incoming request',
   * }
   */
  const outputApiServer = (logData: ApiServerLogs) => {
    const output: (string | undefined)[] = []

    output.push(formatName(logData.name))

    if (logData.req) {
      output.push(formatMethod(logData.req.method))
      output.push(formatUrl(logData.req.url))
    }

    if (logData.res) {
      output.push(formatStatusCode(logData.res.statusCode))
      output.push(formatLoadTime(logData.responseTime))
    }

    output.push(formatMessage(logData))

    return output
  }

  const outputMetadata = (logData: Record<string, unknown>) => {
    const {
      time: _time,
      level: _level,
      pid: _pid,
      hostname: _hostname,
      msg: _msg,
      ns: _ns,
      ...metadata
    } = logData

    return [formatMetadata(metadata)]
  }

  interface LogData {
    time: number
    msg?: string
    level?: string
    elapsed?: string
    contentLength?: string
    ns?: string
    err?: { stack: string }
    stack?: string
  }

  const output = (logData: LogData & GraphqlServerLogs & ApiServerLogs) => {
    let output: (string | undefined)[] = []

    if (!logData.level) {
      logData.level = 'customLevel'
    }

    output.push(formatDate(logData.time || Date.now()))
    output.push(formatLevel(logData.level))

    if (isGraphqlServerLogs(logData)) {
      output = output.concat(outputGraphqlServer(logData))
    } else if (isApiServerLogs(logData)) {
      output = output.concat(outputApiServer(logData))
    }

    // TODO: When is this used?
    const elapsed = logData.elapsed
    if (elapsed) {
      output.push(formatLoadTime(elapsed))
    }

    // TODO: When is this used?
    const contentLength = logData.contentLength
    if (contentLength) {
      output.push(formatBundleSize(contentLength))
    }

    // TODO: When is this used?
    output.push(formatNs(logData.ns))

    if (!isGraphqlServerLogs(logData) && !isApiServerLogs(logData)) {
      output.push(formatMessage(logData))
      // Metadata can for example come from user logs, like
      // logger.debug({ user }, `User ${user.id}`)
      output = output.concat(outputMetadata(logData))
    }

    return output.filter(noEmpty).join(' ')
  }

  return parse
}
