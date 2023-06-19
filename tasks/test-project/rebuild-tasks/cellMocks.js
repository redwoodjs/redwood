const { execAndStreamCodemod, fullPath } = require('./util')

function getCellMockTasks(projectDirectory) {
  return [
    {
      title: 'blog post',
      task: async (task) => {
        await execAndStreamCodemod(
          task,
          'updateBlogPostMocks.js',
          fullPath(
            projectDirectory,
            'web/src/components/BlogPostCell/BlogPostCell.mock.ts',
            { addExtension: false }
          )
        )
      },
    },
    {
      title: 'blog posts',
      task: async (task) => {
        // TODO: Confirm that this is the right codemod?
        await execAndStreamCodemod(
          task,
          'updateBlogPostMocks.js',
          fullPath(
            projectDirectory,
            'web/src/components/BlogPostsCell/BlogPostsCell.mock.ts',
            { addExtension: false }
          )
        )
      },
    },
    {
      title: 'author',
      task: async (task) => {
        await execAndStreamCodemod(
          task,
          'updateAuthorCellMock.js',
          fullPath(
            projectDirectory,
            'web/src/components/AuthorCell/AuthorCell.mock.ts',
            { addExtension: false }
          )
        )
      },
    },
    {
      title: 'waterfallBlogPost',
      task: async (task) => {
        await execAndStreamCodemod(
          task,
          'updateWaterfallBlogPostMocks.js',
          fullPath(
            projectDirectory,
            'web/src/components/WaterfallBlogPostCell/WaterfallBlogPostCell.mock.ts',
            { addExtension: false }
          )
        )
      },
    },
  ]
}

module.exports = {
  getCellMockTasks,
}
