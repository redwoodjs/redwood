import { describe, it } from 'node:test'

import { RuleTester } from 'eslint'

import { serviceTypeAnnotations } from '../service-type-annotations.js'

// @ts-expect-error - Types are wrong
RuleTester.describe = describe
// @ts-expect-error - Types are wrong
RuleTester.it = it

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
})

ruleTester.run('service-type-annotations', serviceTypeAnnotations, {
  valid: [
    {
      code: '// no exports',
    },
    {
      code: 'function abc() {}',
    },
    {
      filename:
        '/app/api/src/services/notificationSubscriptions/notificationSubscriptions.ts',
      code: `
        import type { AbcResolver } from "types/notificationSubscriptions.js"
        export const abc: AbcResolver = () => {}`,
    },
  ],
  invalid: [
    {
      filename:
        '/app/api/src/services/notificationSubscriptions/notificationSubscriptions.ts',
      code: 'export const abc = () => {}',
      output:
        'import type { AbcResolver } from "types/notificationSubscriptions"\n' +
        'export const abc: AbcResolver = () => {}',
      errors: [
        {
          message:
            'The query/mutation function (abc) needs a type annotation of AbcResolver.',
        },
      ],
    },
  ],
})
