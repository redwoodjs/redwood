import path from 'path'

import pluginTester from 'babel-plugin-tester'

import plugin from '../babel-plugin-redwood-routes-auto-loader'

jest.mock('@redwoodjs/internal', () => ({
  getPaths: () => {
    return {
      web: {
        base: '/path/to/example/web',
        pages: '/path/to/example/web/src/pages',
      },
    }
  },
  processPagesDir: () => {
    return [
      {
        importName: 'APage',
        importPath: 'src/pages/APage',
        const: 'APage',
        path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/APage',
        importStatement:
          "const AboutPage = { name: 'APage', loader: () => import('src/pages/APage') }",
      },
      {
        importName: 'BPage',
        importPath: 'src/pages/BPage',
        const: 'BPage',
        path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/BPage',
        importStatement:
          "const AdminEditPostPage = { name: 'BPage', loader: () => import('src/pages/BPage') }",
      },

      {
        importName: 'NestedCPage',
        importPath: 'src/pages/Nested/NestedCPage',
        const: 'BPage',
        path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/BPage',
        importStatement:
          "const AdminEditPostPage = { name: 'BPage', loader: () => import('src/pages/BPage') }",
      },
    ]
  },
}))

pluginTester({
  plugin,
  pluginName: 'babel-plugin-redwood-routes-auto-loader',
  fixtures: path.join(__dirname, '__fixtures__/routes-auto-loader'),
})
