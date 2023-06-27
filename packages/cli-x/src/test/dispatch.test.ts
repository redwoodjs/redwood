import assert from 'node:assert'
import path from 'node:path'
import { describe, it } from 'node:test'

import { DispatchTreeBuilder } from '../builder/index.js'
import { CLIManager } from '../index.js'

const pathToExecuteFunction = path.join(__dirname, './fixtures/exampleExe.js')
// const pathToMiddlewareFunction = path.join(
//   __dirname,
//   './fixtures/exampleMid.js'
// )

/**
 * I do not know how to mock such that I can spy on the execute functions called
 * by the dispatch function. I'm not reaching for jest.
 *
 * For the meantime I'll just have the functions return a value that I can assert
 * on - although this will probably break down for middleware...
 */

describe('dispatch', () => {
  it('dispatches to the correct command', async () => {
    const commandDefinitions = [
      {
        trigger: 'example',
        description: 'An example command',
        execute: pathToExecuteFunction,
      },
      {
        trigger: 'testing',
        description: 'A different command',
        execute: pathToExecuteFunction,
      },
      {
        trigger: 'nested alpha',
        execute: pathToExecuteFunction,
      },
      {
        trigger: 'nested beta',
        execute: pathToExecuteFunction,
      },
    ]

    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')
    for (const commandDefinition of commandDefinitions) {
      builder.addCommandFromDefinition(commandDefinition)
    }
    const dispatchTree = builder.finishBuilding()

    const manager = new CLIManager(dispatchTree)
    const exampleResult = await manager.dispatch(['example'])
    assert.deepStrictEqual(exampleResult, [
      'command-execute',
      {},
      commandDefinitions[0],
    ])

    const testingResult = await manager.dispatch(['testing'])
    assert.deepStrictEqual(testingResult, [
      'command-execute',
      {},
      commandDefinitions[1],
    ])

    const nestedResult = await manager.dispatch(['nested', 'beta'])
    assert.deepStrictEqual(nestedResult, [
      'command-execute',
      {},
      commandDefinitions[3],
    ])
  })
})
