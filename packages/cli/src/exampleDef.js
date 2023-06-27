import path from 'path'

export const trigger = 'example'

export const aliases = ['ex']

export const description = 'An example command'

export const positionalArguments = [
  {
    name: 'pos',
    description: 'A positional argument',
    required: false,
    variadic: false,
  },
]

export const keywordArguments = [
  {
    name: 'keyword',
    description: 'A keyword argument',
    required: false,
    variadic: true,
  },
]

export const middleware = [path.join(__dirname, 'exampleMid.js')]

export const execute = path.join(__dirname, 'exampleExe.js')
