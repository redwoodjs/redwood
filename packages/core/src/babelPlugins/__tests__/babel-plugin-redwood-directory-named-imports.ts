import * as babel from '@babel/core'

import namedDirectory from '../babel-plugin-redwood-directory-named-import'

const testCases = [
  // Directory named imports
  {
    input: 'import pew from "./__fixtures__/directory-named-imports/Module"',
    output: `import pew from "${__dirname}/__fixtures__/directory-named-imports/Module/Module.js";`,
  },
  // Directory named imports TSX
  {
    input: 'import pew from "./__fixtures__/directory-named-imports/TSX"',
    output: `import pew from "${__dirname}/__fixtures__/directory-named-imports/TSX/TSX.tsx";`,
  },
  // Directory named exports
  {
    input:
      'export { pew } from "./__fixtures__/directory-named-imports/Module"',
    output: `export { pew } from "${__dirname}/__fixtures__/directory-named-imports/Module/Module.js";`,
  },
  // // Gives preferences to `index.*`
  {
    input:
      'export { pew } from "./__fixtures__/directory-named-imports/indexModule"',
    output: `export { pew } from "${__dirname}/__fixtures__/directory-named-imports/indexModule/index.js";`,
  },
  // Supports "*.ts"
  {
    input: 'export { pew } from "./__fixtures__/directory-named-imports/TS"',
    output: `export { pew } from "${__dirname}/__fixtures__/directory-named-imports/TS/TS.ts";`,
  },
  // Supports "*.tsx"
  {
    input: 'export { pew } from "./__fixtures__/directory-named-imports/TSX"',
    output: `export { pew } from "${__dirname}/__fixtures__/directory-named-imports/TSX/TSX.tsx";`,
  },
  // Supports "*.jsx"
  {
    input: 'export { pew } from "./__fixtures__/directory-named-imports/JSX"',
    output: `export { pew } from "${__dirname}/__fixtures__/directory-named-imports/JSX/JSX.jsx";`,
  },
]

describe('directory named imports', () => {
  testCases.forEach(({ input, output }) => {
    test(`it should resolve ${input} to ${output}`, () => {
      const babeled = babel.transform(input, {
        babelrc: false,
        filename: __filename, // ordinarily provided
        plugins: [
          [
            namedDirectory,
            {
              rootDir: 'src', // not sure exactly what this means
              honorIndex: true,
            },
          ],
        ],
      }).code
      expect(babeled).toMatch(output)
    })
  })
})
