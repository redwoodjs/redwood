import { getNamedExports, hasDefaultExport } from '../ast'

test('extracts named exports', () => {
  const fakeCode = `
  export { exportA, exportB } from './anotherModule.'
  export const myVariableExport = gql\`query Q { node { field } } \`
  export const myArrowFunctionExport = () => {
    return <>Hello</>
  }
  export function myFunctionExport() {}
  export class MyClassExport {}

  `

  const n = getNamedExports(fakeCode)
  expect(n).toMatchInlineSnapshot(`
    Array [
      Object {
        "name": "exportA",
        "type": "re-export",
      },
      Object {
        "name": "exportB",
        "type": "re-export",
      },
      Object {
        "name": "myVariableExport",
        "type": "variable",
      },
      Object {
        "name": "myArrowFunctionExport",
        "type": "variable",
      },
      Object {
        "name": "myFunctionExport",
        "type": "function",
      },
      Object {
        "name": "MyClassExport",
        "type": "class",
      },
    ]
  `)
})

test('tests default exports', () => {
  expect(
    hasDefaultExport(`
    const a = 'b'
    export default a
  `)
  ).toEqual(true)

  expect(hasDefaultExport(`export default a = 'b'`)).toEqual(true)
  expect(hasDefaultExport(`export const a = 'b'`)).toEqual(false)
})
