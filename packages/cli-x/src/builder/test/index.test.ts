import assert from 'node:assert'
import path from 'node:path'
import { describe, it } from 'node:test'

import { DispatchTreeBuilder } from '../index.js'

import * as exampleDefinition from './fixtures/exampleDef.js'

describe('building', () => {
  it('can build an empty dispatch tree', () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    const dispatchTree = builder.finishBuilding()
    assert.deepStrictEqual(dispatchTree, {
      meta: {
        key: 'example-key',
        version: '1.0.0',
      },
      tree: {},
    })
  })

  it('can build the example dispatch tree from the definition object', () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    builder.addCommandFromDefinition(exampleDefinition)

    const dispatchTree = builder.finishBuilding()
    assert.deepStrictEqual(dispatchTree, {
      meta: {
        key: 'example-key',
        version: '1.0.0',
      },
      tree: {
        children: {
          example: {
            definition: {
              trigger: exampleDefinition.trigger,
              aliases: exampleDefinition.aliases,
              description: exampleDefinition.description,
              positionalArguments: JSON.parse(
                JSON.stringify(exampleDefinition.positionalArguments)
              ),
              keywordArguments: JSON.parse(
                JSON.stringify(exampleDefinition.keywordArguments)
              ),
              middleware: exampleDefinition.middleware,
              execute: exampleDefinition.execute,
            },
          },
          ex: {
            definition: {
              trigger: exampleDefinition.trigger,
              aliases: exampleDefinition.aliases,
              description: exampleDefinition.description,
              positionalArguments: JSON.parse(
                JSON.stringify(exampleDefinition.positionalArguments)
              ),
              keywordArguments: JSON.parse(
                JSON.stringify(exampleDefinition.keywordArguments)
              ),
              middleware: exampleDefinition.middleware,
              execute: exampleDefinition.execute,
            },
            isAliasNode: true,
          },
        },
      },
    })
  })

  it('can build the example dispatch tree from the file path', async () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    await builder.addCommandFromFile(
      path.join(__dirname, './fixtures/exampleDef.js')
    )

    const dispatchTree = builder.finishBuilding()
    assert.deepStrictEqual(dispatchTree, {
      meta: {
        key: 'example-key',
        version: '1.0.0',
      },
      tree: {
        children: {
          example: {
            definition: {
              trigger: exampleDefinition.trigger,
              aliases: exampleDefinition.aliases,
              description: exampleDefinition.description,
              positionalArguments: JSON.parse(
                JSON.stringify(exampleDefinition.positionalArguments)
              ),
              keywordArguments: JSON.parse(
                JSON.stringify(exampleDefinition.keywordArguments)
              ),
              middleware: exampleDefinition.middleware,
              execute: exampleDefinition.execute,
            },
          },
          ex: {
            definition: {
              trigger: exampleDefinition.trigger,
              aliases: exampleDefinition.aliases,
              description: exampleDefinition.description,
              positionalArguments: JSON.parse(
                JSON.stringify(exampleDefinition.positionalArguments)
              ),
              keywordArguments: JSON.parse(
                JSON.stringify(exampleDefinition.keywordArguments)
              ),
              middleware: exampleDefinition.middleware,
              execute: exampleDefinition.execute,
            },
            isAliasNode: true,
          },
        },
      },
    })
  })
})

describe('aliases', () => {
  it('creates an alias node', () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    builder.addCommandFromDefinition({
      trigger: 'example',
      aliases: ['ex'],
    })

    const dispatchTree = builder.finishBuilding()
    assert.deepStrictEqual(dispatchTree.tree, {
      children: {
        example: {
          definition: {
            trigger: 'example',
            aliases: ['ex'],
          },
        },
        ex: {
          definition: {
            trigger: 'example',
            aliases: ['ex'],
          },
          isAliasNode: true,
        },
      },
    })
  })

  it('produces the correct tree with nested aliases', () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    builder.addCommandFromDefinition({
      trigger: 'example',
      aliases: ['ex'],
    })
    builder.addCommandFromDefinition({
      trigger: 'example alpha',
      aliases: ['alfa'],
    })
    builder.addCommandFromDefinition({
      trigger: 'example beta',
    })

    const dispatchTree = builder.finishBuilding()
    assert.deepStrictEqual(dispatchTree.tree, {
      children: {
        example: {
          definition: {
            trigger: 'example',
            aliases: ['ex'],
          },
          children: {
            alpha: {
              definition: {
                trigger: 'example alpha',
                aliases: ['alfa'],
              },
            },
            alfa: {
              definition: {
                trigger: 'example alpha',
                aliases: ['alfa'],
              },
              isAliasNode: true,
            },
            beta: {
              definition: {
                trigger: 'example beta',
              },
            },
          },
        },
        ex: {
          definition: {
            trigger: 'example',
            aliases: ['ex'],
          },
          children: {
            alpha: {
              definition: {
                trigger: 'example alpha',
                aliases: ['alfa'],
              },
            },
            alfa: {
              definition: {
                trigger: 'example alpha',
                aliases: ['alfa'],
              },
              isAliasNode: true,
            },
            beta: {
              definition: {
                trigger: 'example beta',
              },
            },
          },
          isAliasNode: true,
        },
      },
    })
  })
})

describe('validation', () => {
  it('must contain a key', () => {
    const builder = DispatchTreeBuilder.startBuilding()

    builder.setVersion('1.0.0')

    assert.throws(
      () => {
        builder.finishBuilding()
      },
      {
        message: 'Dispatch tree must have a key',
      }
    )
  })

  it('must contain a version', () => {
    const builder = DispatchTreeBuilder.startBuilding()

    builder.setKey('example-key')

    assert.throws(
      () => {
        builder.finishBuilding()
      },
      {
        message: 'Dispatch tree must have a version',
      }
    )
  })

  it('does not allow commands with an execute function to have subcommands', () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    builder.addCommandFromDefinition(exampleDefinition)

    assert.throws(
      () => {
        builder.addCommandFromDefinition({
          trigger: 'example subcommand',
        })
      },
      {
        message:
          "Command 'example' has an execute function and cannot have subcommands",
      }
    )
  })

  it('cannot update/replace the execute function', () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    builder.addCommandFromDefinition(exampleDefinition)

    assert.throws(
      () => {
        builder.addCommandFromDefinition({
          trigger: 'example',
          execute: 'something else',
        })
      },
      {
        message: "Command 'example' already has an execute function",
      }
    )
  })

  it('cannot add an execute function to a command with existing subcommands', () => {
    const builder = DispatchTreeBuilder.startBuilding()
    builder.setKey('example-key')
    builder.setVersion('1.0.0')

    builder.addCommandFromDefinition({
      trigger: 'example subcommand-one',
    })
    builder.addCommandFromDefinition({
      trigger: 'example subcommand-two',
    })

    assert.throws(
      () => {
        builder.addCommandFromDefinition({
          trigger: 'example',
          execute: 'path-to-execute-function',
        })
      },
      {
        message:
          "Command 'example' has subcommands and cannot have an execute function",
      }
    )
  })
})
