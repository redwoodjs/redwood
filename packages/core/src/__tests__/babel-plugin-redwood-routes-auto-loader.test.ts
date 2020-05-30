import path from 'path'

import pluginTester from 'babel-plugin-tester'

import plugin from '../babel-plugin-redwood-routes-auto-loader'

jest.mock('@redwoodjs/internal', () => ({
  getPaths: () => {
    return {
      web: {
        pages: '/path/to/example/web/src/pages',
      },
    }
  },
  processPagesDir: () => {
    return [
      {
        const: 'AboutPage',
        path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/AboutPage',
        importStatement:
          "const AboutPage = { name: 'AboutPage', loader: () => import('src/pages/AboutPage') }",
      },
      {
        const: 'AdminEditPostPage',
        path:
          '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/Admin/EditPostPage',
        importStatement:
          "const AdminEditPostPage = { name: 'AdminEditPostPage', loader: () => import('src/pages/Admin/EditPostPage') }",
      },
      {
        const: 'AdminNewPostPage',
        path:
          '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/Admin/NewPostPage',
        importStatement:
          "const AdminNewPostPage = { name: 'AdminNewPostPage', loader: () => import('src/pages/Admin/NewPostPage') }",
      },
      {
        const: 'AdminPostsPage',
        path:
          '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/Admin/PostsPage',
        importStatement:
          "const AdminPostsPage = { name: 'AdminPostsPage', loader: () => import('src/pages/Admin/PostsPage') }",
      },
      {
        const: 'ContactPage',
        path:
          '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/ContactPage',
        importStatement:
          "const ContactPage = { name: 'ContactPage', loader: () => import('src/pages/ContactPage') }",
      },
      {
        const: 'FatalErrorPage',
        path:
          '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/FatalErrorPage',
        importStatement:
          "const FatalErrorPage = { name: 'FatalErrorPage', loader: () => import('src/pages/FatalErrorPage') }",
      },
      {
        const: 'HomePage',
        path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/HomePage',
        importStatement:
          "const HomePage = { name: 'HomePage', loader: () => import('src/pages/HomePage') }",
      },
      {
        const: 'NotFoundPage',
        path:
          '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/NotFoundPage',
        importStatement:
          "const NotFoundPage = { name: 'NotFoundPage', loader: () => import('src/pages/NotFoundPage') }",
      },
      {
        const: 'PostPage',
        path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/PostPage',
        importStatement:
          "const PostPage = { name: 'PostPage', loader: () => import('src/pages/PostPage') }",
      },
      {
        const: 'SearchPage',
        path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/SearchPage',
        importStatement:
          "const SearchPage = { name: 'SearchPage', loader: () => import('src/pages/SearchPage') }",
      },
      {
        const: 'TaggedPostsPage',
        path:
          '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/TaggedPostsPage',
        importStatement:
          "const TaggedPostsPage = { name: 'TaggedPostsPage', loader: () => import('src/pages/TaggedPostsPage') }",
      },
    ]
  },
}))

pluginTester({
  plugin,
  pluginName: 'babel-plugin-redwood-import-dir',
  fixtures: path.join(__dirname, '__fixtures__/routes-auto-loader'),
})
