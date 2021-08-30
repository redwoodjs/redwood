import { existsSync, readFileSync, statSync } from 'fs'
import os from 'os'
import { join } from 'path'

import { createTestkit } from '@envelop/testing'
import { BaseLogger, LoggerOptions } from 'pino'

import { createLogger } from '@redwoodjs/api/logger'

import { testSchema, testQuery } from '../__fixtures__/common'
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
  logger: BaseLogger
} => {
  const logger = createLogger({
    options: { prettyPrint: false, ...loggerOptions },
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

  it('Should log', async () => {
    const loggerConfig = {
      logger,
      options: { data: true, operationName: true, query: true },
    } as LoggerConfig

    const testkit = createTestkit([useRedwoodLogger(loggerConfig)], testSchema)

    await testkit.execute(testQuery, {}, {})

    await watchFileCreated(logFile)

    const logStatements = parseLogFile(logFile)

    const executionStarted = logStatements[0]
    const executionCompleted = logStatements[1]

    expect(executionStarted).toHaveProperty('level')
    expect(executionStarted).toHaveProperty('time')
    expect(executionStarted).toHaveProperty('msg')
    expect(executionStarted).toHaveProperty('query')

    expect(executionStarted.name).toEqual('graphql-server')
    expect(executionStarted.level).toEqual(20)
    expect(executionStarted.msg).toEqual('GraphQL execution started')

    expect(executionCompleted).toHaveProperty('level')
    expect(executionCompleted).toHaveProperty('time')
    expect(executionCompleted).toHaveProperty('msg')
    expect(executionCompleted).toHaveProperty('query')
    expect(executionCompleted).toHaveProperty('data')

    expect(executionCompleted.msg).toEqual('GraphQL execution completed')
    expect(executionCompleted.data).toHaveProperty('me')
    expect(executionCompleted.data.me.name).toEqual('Ba Zinga')
  })
})
