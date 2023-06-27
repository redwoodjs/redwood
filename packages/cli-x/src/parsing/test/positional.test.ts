import assert from 'node:assert'
import { describe, it } from 'node:test'

import { KeywordArgument, PositionalArgument, parse } from '../index'

describe('returns the correct values', () => {
  it('none expected', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {})
  })

  it('1 expected', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: 'first',
    })
  })

  it('2 expected', () => {
    const args = ['first', 'second']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
      {
        name: 'another',
        description: 'Another positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: 'first',
      another: 'second',
    })
  })
})

describe('returns the default values', () => {
  it('is default', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: false,
        default: 'default',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: 'default',
    })
  })

  it('is not default when specified', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: false,
        default: 'default',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: 'first',
    })
  })

  it('is default for variadic', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: true,
        default: ['default', 'values'],
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: ['default', 'values'],
    })
  })

  it('is not default for variadic when specified', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: true,
        default: ['default', 'values'],
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: ['first'],
    })
  })
})

describe('returns the correct variadic values', () => {
  it('none expected', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, { positional: undefined })
  })

  it('1 value', () => {
    const args = ['p1']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, { positional: ['p1'] })
  })

  it('2 values', () => {
    const args = ['p1', 'p2']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, { positional: ['p1', 'p2'] })
  })
})

describe('throws when too few arguments are provided', () => {
  it('none provided when 1 expected', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: "Missing required positional argument: 'positional'",
    })
  })

  it('1 provided when 2 expected', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
      {
        name: 'another',
        description: 'Another positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: "Missing required positional argument: 'another'",
    })
  })

  it('none provided when 1 expected variadic', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: "Missing required positional argument: 'positional'",
    })
  })
})

describe('throws when too many arguments are provided', () => {
  it('none expected', () => {
    const args = ['test']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: `Too many positional arguments provided: 'test'`,
    })
  })

  it('1 expected but 2 given', () => {
    const args = ['test', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: `Too many positional arguments provided: 'another'`,
    })
  })

  it('2 expected but 3 given', () => {
    const args = ['test', 'another', 'yet-another']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: `Too many positional arguments provided: 'another yet-another'`,
    })
  })
})

describe('respects the -- separator', () => {
  it('1 value expected', () => {
    const args = ['--', 'test']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: 'test',
    })
  })

  it('2 expected', () => {
    const args = ['first', '--', 'test']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      positional: ['first', 'test'],
    })
  })

  it('2 expected but should throw as non variadic', () => {
    const args = ['first', '--', 'test']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: `Too many positional arguments provided: 'test'`,
      }
    )
  })

  it('3 expected variadic', () => {
    const args = ['first', 'second', '--', 'test']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: ['first', 'second', 'test'],
    })
  })
})

describe('returns the correct type', () => {
  it('defaults to string when no type given', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: 'first',
    })
  })

  it('defaults to string when no type given variadic', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: ['first'],
    })
  })

  it('type is string', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
        type: 'string',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: 'first',
    })
  })

  it('type is string variadic', () => {
    const args = ['first', 'second']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
        type: 'string',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: ['first', 'second'],
    })
  })

  it('type is number', () => {
    const args = ['1']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: false,
        type: 'number',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: 1,
    })
  })

  it('type is number variadic', () => {
    const args = ['0', '3.14']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: true,
        variadic: true,
        type: 'number',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: [0, 3.14],
    })
  })

  it('type is boolean', () => {
    const args = ['true']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: false,
        type: 'boolean',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: true,
    })
  })

  it('type is boolean variadic', () => {
    const args = ['true', 'false']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        required: false,
        variadic: true,
        type: 'boolean',
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: [true, false],
    })
  })

  it('type is json', () => {
    const args = ['{"test": true}']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        type: 'json',
        required: false,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, { positional: { test: true } })
  })

  it('type is json variadic', () => {
    const args = ['{"test": true}', '{"check": false}']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        type: 'json',
        required: false,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      positional: [{ test: true }, { check: false }],
    })
  })

  it('throws when type casting fails', () => {
    const args = ['x']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        type: 'number',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: `Failed to convert 'positional' to number`,
    })
  })

  it('throws when type casting fails variadic', () => {
    const args = ['x', 'y']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional',
        description: 'The positional argument',
        type: 'number',
        required: true,
        variadic: true,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parseArgs = () =>
      parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
    assert.throws(parseArgs, {
      message: `Failed to convert 'positional' to number`,
    })
  })
})

describe('provides camel case aliases', () => {
  it('includes alias when expected', () => {
    const args = ['first']
    const positionalArgumentsDefinition: PositionalArgument[] = [
      {
        name: 'positional-kebab-variable',
        description: 'The positional argument',
        required: true,
        variadic: false,
      },
    ]
    const keywordArgumentsDefinition: KeywordArgument[] = []

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )

    assert.deepStrictEqual(parsedArgs, {
      ['positional-kebab-variable']: 'first',
      positionalKebabVariable: 'first',
    })
  })
})
