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
    const args = ['--first', 'value']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, { first: 'value' })
  })

  it('2 expected', () => {
    const args = ['--first', 'value', '--second', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
      },
      {
        name: 'second',
        description: 'The second keyword argument',
        required: true,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, { first: 'value', second: 'another' })
  })
})

describe('returns the default values', () => {
  it('is default', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: false,
        default: 'default',
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: 'default',
    })
  })

  it('is not default when specified', () => {
    const args = ['--first', 'value']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: false,
        default: 'default',
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: 'value',
    })
  })

  it('is default variadic', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
        default: ['default'],
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['default'],
    })
  })

  it('is not default when specified variadic', () => {
    const args = ['--first', 'value', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
        default: ['default'],
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value', 'another'],
    })
  })
})

describe('returns the correct variadic values', () => {
  it('none expected', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {})
  })

  it('1 value provided', () => {
    const args = ['--first', 'value']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value'],
    })
  })

  it('2 values provided each flagged', () => {
    const args = ['--first', 'value', '--first', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value', 'another'],
    })
  })

  it('2 values provided with one flag', () => {
    const args = ['--first', 'value', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value', 'another'],
    })
  })

  it('2 values provided with others between', () => {
    const args = [
      '--first',
      'value',
      '--other',
      'something',
      '--first',
      'another',
    ]
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
      },
      {
        name: 'other',
        description: 'The other keyword argument',
        required: false,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value', 'another'],
      other: 'something',
    })
  })
})

describe('throws for missing required keyword arguments', () => {
  it('none provided when 1 expected', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
      },
    ]
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: "Missing required keyword argument: 'first'",
      }
    )
  })

  it('1 provided when 2 expected', () => {
    const args = ['--first', 'value']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
      },
      {
        name: 'second',
        description: 'The second keyword argument',
        required: true,
        variadic: false,
      },
    ]
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: "Missing required keyword argument: 'second'",
      }
    )
  })

  it('none provided when 1 expected variadic', () => {
    const args = []
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: true,
      },
    ]
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: "Missing required keyword argument: 'first'",
      }
    )
  })

  it('none provided when 1 expected variadic with flag', () => {
    const args = ['--first']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: false,
        variadic: true,
      },
    ]
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message:
          "Invalid keyword argument: '--first' - no values provided for variadic keyword",
      }
    )
  })
})

describe('throws for excess keyword arguments', () => {
  it('unknown long keyword', () => {
    const args = ['--unknown']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = []
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: `Invalid keyword argument: '--unknown'`,
      }
    )
  })

  it('unknown short keyword', () => {
    const args = ['-u']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = []
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: `Invalid keyword argument: '-u'`,
      }
    )
  })

  it('1 expected when 2 provided', () => {
    const args = ['--first', 'value', '--first', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
      },
    ]
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message:
          "Invalid keyword argument: '--first' - cannot provide more than one value for '--first'",
      }
    )
  })
})

describe('throws for malformed input', () => {
  it('single character long keyword', () => {
    const args = ['--l']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
      },
    ]
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: "Invalid keyword argument: '--l'",
      }
    )
  })

  it('multiple character short keyword', () => {
    const args = ['-long']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
      },
    ]
    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: "Invalid keyword argument: '-long'",
      }
    )
  })
})

describe('supports aliases', () => {
  it('uses the alias', () => {
    const args = ['--initial', 'value']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
        aliases: ['initial', 'start'],
      },
    ]
    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: 'value',
    })
  })

  it('cannot use more than one alias without variadic', () => {
    const args = ['--initial', 'value', '--start', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
        aliases: ['initial', 'start'],
      },
    ]

    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message:
          "Invalid keyword argument: '--start' - cannot provide more than one value for '--first'",
      }
    )
  })

  it('can use more than one alias with variadic', () => {
    const args = ['--initial', 'value', '--start', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: true,
        aliases: ['initial', 'start'],
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value', 'another'],
    })
  })
})

describe('supports short flags', () => {
  //
})

describe('supports booleans with --no- prefix', () => {
  it('is false with --no- prefix', () => {
    const args = ['--no-first']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: '',
        required: true,
        variadic: false,
        type: 'boolean',
      },
    ]
    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, { first: false })
  })

  it('cannot be used with non booleans', () => {
    const args = ['--no-first']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: '',
        required: true,
        variadic: false,
      },
    ]

    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message:
          "Invalid keyword argument: '--no-first' - cannot invert non-boolean keyword",
      }
    )
  })
})

describe('supports booleans with no explicit value', () => {
  it('is true without an explicit value', () => {
    const args = ['--first']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: false,
        type: 'boolean',
      },
    ]
    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, { first: true })
  })

  it('cannot be used with variadic arguments', () => {
    const args = ['--first']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: 'The first keyword argument',
        required: true,
        variadic: true,
        type: 'boolean',
      },
    ]

    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message:
          "Invalid keyword argument: '--first' - no values provided for variadic keyword",
      }
    )
  })
})

describe('returns the correct types', () => {
  it('defaults to string when no type given', () => {
    const args = ['--first', 'value']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: '',
        required: true,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: 'value',
    })
  })

  it('defaults to string when no type given variadic', () => {
    const args = ['--first', 'value', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        description: '',
        required: true,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value', 'another'],
    })
  })

  it('type is string', () => {
    const args = ['--first', 'value']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'string',
        description: '',
        required: true,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: 'value',
    })
  })

  it('type is string variadic', () => {
    const args = ['--first', 'value', 'another']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'string',
        description: '',
        required: true,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: ['value', 'another'],
    })
  })

  it('type is number', () => {
    const args = ['--first', '1']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'number',
        description: '',
        required: true,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: 1,
    })
  })

  it('type is number variadic', () => {
    const args = ['--first', '0', '3.14']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'number',
        description: '',
        required: true,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: [0, 3.14],
    })
  })

  it('type is boolean', () => {
    const args = ['--first', 'true']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'boolean',
        description: '',
        required: true,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: true,
    })
  })

  it('type is boolean variadic', () => {
    const args = ['--first', 'true', 'false']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'boolean',
        description: '',
        required: true,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: [true, false],
    })
  })

  it('type is json', () => {
    const args = ['--first', '{"a":1}']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'json',
        description: '',
        required: true,
        variadic: false,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: { a: 1 },
    })
  })

  it('type is json variadic', () => {
    const args = ['--first', '{"a":1}', '{"b":2}']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'json',
        description: '',
        required: true,
        variadic: true,
      },
    ]

    const parsedArgs = parse(
      args,
      positionalArgumentsDefinition,
      keywordArgumentsDefinition
    )
    assert.deepStrictEqual(parsedArgs, {
      first: [{ a: 1 }, { b: 2 }],
    })
  })

  it('throws when type casting fails', () => {
    const args = ['--first', 'x']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'number',
        description: '',
        required: true,
        variadic: false,
      },
    ]

    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: `Failed to convert 'first' to number`,
      }
    )
  })

  it('throws when type casting fails variadic', () => {
    const args = ['--first', '1', 'x']
    const positionalArgumentsDefinition: PositionalArgument[] = []
    const keywordArgumentsDefinition: KeywordArgument[] = [
      {
        name: 'first',
        type: 'number',
        description: '',
        required: true,
        variadic: true,
      },
    ]

    assert.throws(
      () => {
        parse(args, positionalArgumentsDefinition, keywordArgumentsDefinition)
      },
      {
        message: `Failed to convert 'first' to number`,
      }
    )
  })
})
