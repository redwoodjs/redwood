import { describe, it } from 'node:test'

import { RuleTester } from 'eslint'

import { processEnvComputedRule } from '../process-env-computed.js'

// @ts-expect-error - Types are wrong
RuleTester.describe = describe
// @ts-expect-error - Types are wrong
RuleTester.it = it

const ruleTester = new RuleTester()

ruleTester.run('process-env-computed', processEnvComputedRule, {
  valid: [
    {
      code: 'process.env.foo',
    },
    {
      code: 'process.env.BAR',
    },
    {
      code: 'process.env.REDWOOD_ENV_FOOBAR',
    },
  ],
  invalid: [
    {
      code: 'process.env[foo]',
      errors: [
        {
          message: 'Computed member access on process.env is not allowed.',
        },
      ],
    },
    {
      code: "process.env['BAR']",
      errors: [
        {
          message: 'Computed member access on process.env is not allowed.',
        },
      ],
    },
  ],
})
