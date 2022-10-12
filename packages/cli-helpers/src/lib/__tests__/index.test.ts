import { prettify } from '../index'

jest.mock('../paths', () => {
  return {
    getPaths: () => {
      return {
        base: '../../../../__fixtures__/example-todo-main',
      }
    },
  }
})

test('prettify formats tsx content', () => {
  const content = `import React from 'react'

  interface Props { foo: number, bar: number }

  const FooBarComponent: React.FC<Props> = ({ foo, bar }) => {
    if (foo % 3 === 0 && bar % 5 === 0) {
      return <>FooBar</>
    }

    if (foo % 3 === 0 || bar % 3 === 0) {
      return <>Foo</>;
    }

    if (foo % 5 === 0 || bar % 5 === 0) { return <>Bar</>}

    return <>{foo}, {bar}</>}`

  expect(prettify('FooBarComponent.template.tsx', content)).toMatchSnapshot()
})
