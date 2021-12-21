import { existsSync, readFileSync, statSync } from 'fs'
import os from 'os'
import { join } from 'path'

import { createTestkit } from '@envelop/testing'

import type { Logger, LoggerOptions } from '@redwoodjs/api/logger'
import { createLogger } from '@redwoodjs/api/logger'

import {
  testSchema,
  testQuery,
  testErrorQuery,
  testFilteredQuery,
} from '../__fixtures__/common'
import { LoggerConfig, useRedwoodLogger } from '../useRedwoodLogger'

const watchFileCreated = (filename) => {
  return new Promise((resolve, reject) => {
    const TIMEOUT = 800
    const INTERVAL = 100
    const threshold = TIMEOUT / INTERVAL
    let counter = 0
    const interval = setInterval(() => {
      // On some CI runs file is created but not filled
      if (existsSync(filename) && statSync(filename).size !== 0) {
        clearInterval(interval)
        resolve(null)
      } else if (counter <= threshold) {
        counter++
      } else {
        clearInterval(interval)
        reject(new Error(`${filename} was not created.`))
      }
    }, INTERVAL)
  })
}

const parseLogFile = (logFile) => {
  return JSON.parse(
    `[${readFileSync(logFile)
      .toString()
      .trim()
      .split(/\r\n|\n/)
      .join(',')}]`
  )
}

const setupLogger = (
  loggerOptions: LoggerOptions,
  destination: string
): {
  logger: Logger
} => {
  const logger = createLogger({
    options: { ...loggerOptions },
    destination: destination,
  })

  return { logger }
}

describe('Populates context', () => {
  const logFile = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  const { logger } = setupLogger(
    { level: 'trace', prettyPrint: false },
    logFile
  )

  it('Should log debug statements around GraphQL the execution phase', async () => {
    const loggerConfig = {
      logger,
      options: { data: true, query: true, operationName: true },
    } as LoggerConfig

    const testkit = createTestkit([useRedwoodLogger(loggerConfig)], testSchema)

    await testkit.execute(testQuery, {}, {})

    await watchFileCreated(logFile)

    const logStatements = parseLogFile(logFile)

    const executionCompleted = logStatements.pop()
    const executionStarted = logStatements.pop()

    expect(executionStarted).toHaveProperty('level')
    expect(executionStarted).toHaveProperty('time')
    expect(executionStarted).toHaveProperty('msg')
    expect(executionStarted).toHaveProperty('query')

    expect(executionStarted.name).toEqual('graphql-server')
    expect(executionStarted.level).toEqual(20)
    expect(executionStarted.msg).toEqual('GraphQL execution started: meQuery')

    expect(executionCompleted).toHaveProperty('level')
    expect(executionCompleted).toHaveProperty('time')
    expect(executionCompleted).toHaveProperty('msg')
    expect(executionCompleted).toHaveProperty('query')
    expect(executionCompleted).toHaveProperty('operationName')
    expect(executionCompleted).toHaveProperty('data')

    expect(executionCompleted.msg).toEqual(
      'GraphQL execution completed: meQuery'
    )
    expect(executionCompleted.data).toHaveProperty('me')
    expect(executionCompleted.operationName).toEqual('meQuery')
    expect(executionCompleted.data.me.name).toEqual('Ba Zinga')
  })

  it('Should log an error when the resolver raises an exception', async () => {
    const loggerConfig = {
      logger,
      options: {},
    } as LoggerConfig

    const testkit = createTestkit([useRedwoodLogger(loggerConfig)], testSchema)

    await testkit.execute(testErrorQuery, {}, {})

    await watchFileCreated(logFile)

    const logStatements = parseLogFile(logFile)

    const errorLogStatement = logStatements.pop()

    expect(errorLogStatement).toHaveProperty('level')
    expect(errorLogStatement).toHaveProperty('time')
    expect(errorLogStatement).toHaveProperty('msg')
    expect(errorLogStatement).toHaveProperty('error')

    expect(errorLogStatement.name).toEqual('graphql-server')
    expect(errorLogStatement.level).toEqual(50)
    expect(errorLogStatement.msg).toEqual('You are forbidden')
  })

  it('Should not log filtered graphql operations', async () => {
    const loggerConfig = {
      logger,
      options: {
        excludeOperations: ['FilteredQuery'],
      },
    } as LoggerConfig
    const testkit = createTestkit([useRedwoodLogger(loggerConfig)], testSchema)
    await testkit.execute(testFilteredQuery, {}, {})
    await watchFileCreated(logFile)

    const logStatements = parseLogFile(logFile)

    expect(logStatements).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: expect.stringContaining('FilteredQuery'),
        }),
      ])
    )
  })
})
