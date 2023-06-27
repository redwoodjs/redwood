export const trigger = 'example'

export const aliases = ['ex']

export const description = 'An example command'

export const positionalArguments = [
  {
    name: 'pos',
    description: 'A positional argument',
    required: true,
    variadic: false,
  },
]

export const keywordArguments = [
  {
    name: 'key',
    description: 'A keyword argument',
    required: true,
    variadic: false,
  }
]

export const middleware = ['some-middleware-file.js']

export const execute = 'some-execute-file.js'



