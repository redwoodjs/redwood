import gql from 'graphql-tag'

import { parseDirectives } from '../directives/parseDirectives'

test('Should map globs to defined structure correctly', async () => {
  // Mocking what our import-dir plugin would do
  const directiveFiles = {
    foo: {
      foo: () => 'I am foo',
      schema: gql`
        directive @foo on FIELD_DEFINITION
      `,
    },
    nested_bazinga: {
      bazinga: async () => 'I am bazinga, async',
      schema: gql`
        directive @bazinga on FIELD_DEFINITION
      `,
    },
    heavily_nested_bar: {
      bar: async () => 'I am bar, async',
      schema: gql`
        directive @bar on FIELD_DEFINITION
      `,
    },
  }

  const [fooDirective, bazingaDirective, barDirective] =
    parseDirectives(directiveFiles)

  expect(fooDirective.name).toBe('foo')
  expect(fooDirective.onExecute()).toBe('I am foo')
  expect(fooDirective.schema.kind).toBe('Document')

  expect(bazingaDirective.name).toBe('bazinga')
  expect(await bazingaDirective.onExecute()).toBe('I am bazinga, async')
  expect(bazingaDirective.schema.kind).toBe('Document')

  expect(barDirective.name).toBe('bar')
  expect(await barDirective.onExecute()).toBe('I am bar, async')
  expect(barDirective.schema.kind).toBe('Document')
})
