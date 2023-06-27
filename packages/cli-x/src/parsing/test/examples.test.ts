import assert from 'node:assert'
import { describe, it } from 'node:test'

import { KeywordArgument, PositionalArgument, parse } from '../index'

interface TestCase {
  args: string[]
  positionalArgumentsDefinition: PositionalArgument[]
  keywordArgumentsDefinition: KeywordArgument[]
  expected: any
  throws?: {
    message: string
  }
}

/**
 * These are intended to be random examples of typical command line arguments
 */
const testCases: TestCase[] = [
  {
    args: [],
    positionalArgumentsDefinition: [],
    keywordArgumentsDefinition: [],
    expected: {},
  },
  {
    args: ['fakePath', '--verbose', '--repeat', '3', '--no-rollback'],
    positionalArgumentsDefinition: [
      {
        name: 'path',
        description: 'The path to the file',
        required: true,
        variadic: false,
      },
    ],
    keywordArgumentsDefinition: [
      {
        name: 'verbose',
        description: 'Whether to be verbose',
        required: false,
        default: false,
        type: 'boolean',
        variadic: false,
      },
      {
        name: 'repeat',
        description: 'How many times to repeat',
        required: false,
        default: 1,
        type: 'number',
        variadic: false,
      },
      {
        name: 'rollback',
        description: 'Whether to rollback',
        required: false,
        default: true,
        type: 'boolean',
        variadic: false,
      },
    ],
    expected: {
      path: 'fakePath',
      verbose: true,
      repeat: 3,
      rollback: false,
    },
  },
  {
    args: [
      '--input',
      'file.txt',
      '--output',
      'output.txt',
      '--format',
      'json',
      '--verbose',
      '--compress',
    ],
    positionalArgumentsDefinition: [],
    keywordArgumentsDefinition: [
      {
        name: 'input',
        description: 'The input file',
        required: true,
        variadic: false,
      },
      {
        name: 'output',
        description: 'The output file',
        required: true,
        variadic: false,
      },
      {
        name: 'format',
        description: 'The output format',
        required: false,
        default: 'text',
        type: 'string',
        variadic: false,
      },
      {
        name: 'verbose',
        description: 'Whether to be verbose',
        required: false,
        default: false,
        type: 'boolean',
        variadic: false,
      },
      {
        name: 'compress',
        description: 'Whether to compress',
        required: false,
        default: true,
        type: 'boolean',
        variadic: false,
      },
    ],
    expected: {
      input: 'file.txt',
      output: 'output.txt',
      format: 'json',
      verbose: true,
      compress: true,
    },
  },
  {
    args: [
      '--source',
      'data.csv',
      'meta.csv',
      '--destination',
      'backup/',
      '--delimiter',
      ',',
      '--no-overwrite',
      '--dry-run',
    ],
    positionalArgumentsDefinition: [
      {
        name: 'action',
        description: 'The action to perform',
        required: false,
        variadic: false,
        default: 'backup',
      },
    ],
    keywordArgumentsDefinition: [
      {
        name: 'source',
        description: 'The source file',
        required: true,
        variadic: true,
        type: 'string',
      },
      {
        name: 'destination',
        description: 'The destination directory',
        required: true,
        variadic: false,
        type: 'string',
        default: 'output.txt',
      },
      {
        name: 'delimiter',
        description: 'The delimiter to use',
        required: false,
        variadic: false,
        type: 'string',
        default: '|',
      },
      {
        name: 'overwrite',
        description: 'Whether to overwrite',
        required: false,
        variadic: false,
        type: 'boolean',
      },
      {
        name: 'dry-run',
        description: 'Whether to perform a dry run',
        required: true,
        variadic: false,
        type: 'boolean',
      },
    ],
    expected: {
      action: 'backup',
      source: ['data.csv', 'meta.csv'],
      destination: 'backup/',
      delimiter: ',',
      overwrite: false,
      'dry-run': true,
      dryRun: true,
    },
  },
  {
    args: [
      'convert',
      'image.png',
      'image.jpg',
      '--quality',
      '90',
      '--resize',
      '800x600',
    ],
    positionalArgumentsDefinition: [
      {
        name: 'action',
        description: 'The action to perform',
        required: true,
        variadic: false,
      },
      {
        name: 'source',
        description: 'The source file',
        required: true,
        variadic: false,
      },
      {
        name: 'destination',
        description: 'The destination file',
        required: true,
        variadic: false,
      },
    ],
    keywordArgumentsDefinition: [
      {
        name: 'quality',
        description: 'The quality to use',
        required: false,
        variadic: false,
        type: 'number',
        default: 80,
      },
      {
        name: 'resize',
        description: 'The size to resize to',
        required: false,
        variadic: false,
        type: 'string',
      },
      {
        name: 'overwrite',
        description: 'Whether to overwrite',
        required: false,
        variadic: false,
        type: 'boolean',
        default: false,
      },
    ],
    expected: {
      action: 'convert',
      source: 'image.png',
      destination: 'image.jpg',
      quality: 90,
      resize: '800x600',
      overwrite: false,
    },
  },
  {
    args: [
      'quick',
      'logs.txt',
      '--output',
      'parsed_logs.json',
      '--filter',
      'level:ERROR',
      '--timestamp-format',
      'iso8601',
      '--',
      '--additional-option',
      'additional-value',
    ],
    positionalArgumentsDefinition: [
      {
        name: 'mode',
        description: 'The mode to run in',
        required: true,
        variadic: false,
        default: 'lazy',
        type: 'string',
      },
      {
        name: 'source',
        description: 'The source file',
        required: true,
        variadic: false,
      },
    ],
    keywordArgumentsDefinition: [
      {
        name: 'output',
        description: 'The output file',
        required: false,
        variadic: false,
        type: 'string',
        default: 'output.txt',
      },
      {
        name: 'filter',
        description: 'The filter to apply',
        required: false,
        variadic: true,
        type: 'number',
      },
      {
        name: 'timestamp-format',
        description: 'The timestamp format to use',
        required: false,
        variadic: false,
        type: 'string',
        default: 'rfc3339',
      },
    ],
    expected: {},
    throws: {
      message:
        "Too many positional arguments provided: '--additional-option additional-value'",
    },
  },
  {
    args: [
      'POST',
      'https://api.example.com',
      '--headers',
      'Authorization: Bearer abc123',
      '--timeout',
      '10000',
      '--',
      '--param1',
      'value1',
      '--param2',
      'value2',
    ],
    positionalArgumentsDefinition: [
      {
        name: 'method',
        description: 'The HTTP method',
        required: true,
        variadic: false,
        default: 'GET',
      },
      {
        name: 'url',
        description: 'The URL to request',
        required: true,
        variadic: false,
      },
      {
        name: 'params',
        description: 'The query parameters',
        required: false,
        variadic: true,
        type: 'string',
      },
    ],
    keywordArgumentsDefinition: [
      {
        name: 'headers',
        description: 'The headers to send',
        required: false,
        variadic: true,
        type: 'string',
      },
      {
        name: 'timeout',
        description: 'The timeout in milliseconds',
        required: false,
        variadic: false,
        type: 'number',
        default: 5000,
      },
    ],
    expected: {
      method: 'POST',
      url: 'https://api.example.com',
      headers: ['Authorization: Bearer abc123'],
      timeout: 10000,
      params: ['--param1', 'value1', '--param2', 'value2'],
    },
  },
  {
    args: ['10', '20', '3.14', '--no-rounding', '--', '40', '50', '6.28'],
    positionalArgumentsDefinition: [
      {
        name: 'numbers',
        description: 'The numbers to add',
        required: true,
        variadic: true,
        type: 'number',
      },
    ],
    keywordArgumentsDefinition: [
      {
        name: 'rounding',
        description: 'Whether to round',
        required: false,
        variadic: false,
        type: 'boolean',
        default: true,
      },
    ],
    expected: {
      numbers: [10, 20, 3.14, 40, 50, 6.28],
      rounding: false,
    },
  },
  {
    args: [
      'task',
      'run',
      'script.js',
      '--name',
      'My App 😊',
      '--path',
      '/usr/local',
      '--config',
      'config.json',
      '--verbose',
      '--timeout',
      '5000',
      '--option1',
      'value 1',
      '--option2',
      'value 2',
      '--option3',
      'value 3',
      '--option4',
      'value 4',
      '--option5',
      'value 5',
      '--option6',
      '--option9',
      'value 9',
      '--option10',
      '{"key": "value"}',
      '--emoji',
      '🌟',
      '--unicode',
      '💡',
      '--japanese',
      'こんにちは',
      '--quoted',
      '"This is quoted text"',
      '--number',
      '42',
      '--decimal',
      '3.14',
      '--',
      'additional-positional1',
      'additional value 1',
      'additional-positional2',
      'additional value 2',
    ],
    positionalArgumentsDefinition: [
      {
        name: 'command',
        description: 'The command to run',
        required: true,
        variadic: true,
        type: 'string',
      },
    ],
    keywordArgumentsDefinition: [
      {
        name: 'name',
        description: 'The name of the app',
        required: false,
        variadic: false,
      },
      {
        name: 'path',
        description: 'The path to use',
        required: false,
        variadic: false,
        type: 'string',
        default: '/usr/bin',
      },
      {
        name: 'config',
        description: 'The config file to use',
        required: false,
        variadic: false,
        type: 'string',
        default: 'config.toml',
      },
      {
        name: 'verbose',
        description: 'Whether to be verbose',
        required: false,
        variadic: false,
        type: 'boolean',
        default: false,
      },
      {
        name: 'timeout',
        description: 'The timeout in milliseconds',
        required: false,
        variadic: false,
        type: 'number',
        default: -1,
      },
      {
        name: 'option1',
        description: 'Option 1',
        required: false,
        variadic: false,
      },
      {
        name: 'option2',
        description: 'Option 2',
        required: false,
        variadic: true,
      },
      {
        name: 'option4',
        description: 'Option 4',
        required: true,
        variadic: false,
      },
      {
        name: 'option3',
        description: 'Option 3',
        required: true,
        variadic: true,
      },
      {
        name: 'option5',
        description: 'Option 5',
        required: false,
        variadic: false,
      },
      {
        name: 'option6',
        description: 'Option 6',
        required: false,
        variadic: false,
        type: 'boolean',
      },
      {
        name: 'option7',
        description: 'Option 7',
        required: false,
        variadic: false,
        default: 'default value',
      },
      {
        name: 'option8',
        description: 'Option 8',
        required: false,
        variadic: false,
        default: { test: 'default value' },
        type: 'json',
      },
      {
        name: 'option9',
        description: 'Option 9',
        required: false,
        variadic: false,
      },
      {
        name: 'option10',
        description: 'Option 10',
        required: true,
        variadic: true,
        type: 'json',
      },
      {
        name: 'emoji',
        description: 'Emoji',
        required: false,
        variadic: false,
      },
      {
        name: 'unicode',
        description: 'Unicode',
        required: false,
        variadic: true,
        type: 'string',
      },
      {
        name: 'japanese',
        description: 'Japanese',
        required: false,
        variadic: false,
      },
      {
        name: 'quoted',
        description: 'Quoted',
        required: true,
        variadic: false,
        type: 'string',
      },
      {
        name: 'number',
        description: 'Number',
        required: false,
        variadic: false,
        type: 'number',
      },
      {
        name: 'decimal',
        description: 'Decimal',
        required: false,
        variadic: false,
        type: 'number',
      },
    ],
    expected: {
      command: [
        'task',
        'run',
        'script.js',
        'additional-positional1',
        'additional value 1',
        'additional-positional2',
        'additional value 2',
      ],
      name: 'My App 😊',
      path: '/usr/local',
      config: 'config.json',
      verbose: true,
      timeout: 5000,
      option1: 'value 1',
      option2: ['value 2'],
      option3: ['value 3'],
      option4: 'value 4',
      option5: 'value 5',
      option6: true,
      option7: 'default value',
      option8: { test: 'default value' },
      option9: 'value 9',
      option10: [{ key: 'value' }],
      emoji: '🌟',
      unicode: ['💡'],
      japanese: 'こんにちは',
      quoted: '"This is quoted text"',
      number: 42,
      decimal: 3.14,
    },
  },
]

describe('example test cases', () => {
  for (const testCase of testCases) {
    it(`handles '${testCase.args.join(' ')}'`, () => {
      if (testCase.throws) {
        assert.throws(() => {
          parse(
            testCase.args,
            testCase.positionalArgumentsDefinition,
            testCase.keywordArgumentsDefinition
          )
        }, testCase.throws)
      } else {
        const parsedArgs = parse(
          testCase.args,
          testCase.positionalArgumentsDefinition,
          testCase.keywordArgumentsDefinition
        )
        assert.deepStrictEqual(parsedArgs, testCase.expected)
      }
    })
  }
})
