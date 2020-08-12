import path from 'path'

import pluginTester from 'babel-plugin-tester'

import plugin from '../babel-plugin-redwood-import-dir'

describe('babel plugin redwood import dir', () => {
  pluginTester({
    plugin,
    pluginOptions: {
      generateTypesPath: '__fixtures__/import-dir',
      host: {
        readFileSync: () => '',
        appendFileSync: (p, contents) => {
          expect(p).toEqual('__fixtures__/import-dir/index.d.ts')
          expect(contents).toEqual(
            `<reference path="import-dir-services.d.ts" />`
          )
        },
        writeFileSync: (p, contents) => {
          expect(p).toEqual('__fixtures__/import-dir/import-dir-services.d.ts')
          expect(contents.replace(/\s/g, '')).toMatch(
            `// @ts-expect-error
            declare module 'src/__fixtures__/**/*.{js,ts}';
            `.replace(/\s/g, '')
          )
        },
      },
    },
    pluginName: 'babel-plugin-redwood-import-dir',
    fixtures: path.join(__dirname, '__fixtures__/import-dir'),
  })
})
