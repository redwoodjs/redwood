const {
  execAndStreamRedwoodCommand,
  execAndStreamCodemod,
  fullPath,
} = require('./util')

function getCellTasks(projectDirectory) {
  return [
    {
      title: 'blog posts',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'cell', 'blogPosts'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'blogPostsCell.js',
          fullPath(
            projectDirectory,
            'web/src/components/BlogPostsCell/BlogPostsCell'
          )
        )
      },
    },
    {
      title: 'blog post',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'cell', 'blogPost'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'blogPostCell.js',
          fullPath(
            projectDirectory,
            'web/src/components/BlogPostCell/BlogPostCell'
          )
        )
      },
    },
    {
      title: 'author',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'cell', 'author'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'authorCell.js',
          fullPath(projectDirectory, 'web/src/components/AuthorCell/AuthorCell')
        )
      },
    },
    {
      title: 'waterfallBlogPost',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'cell', 'waterfallBlogPost'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'waterfallBlogPostCell.js',
          fullPath(
            projectDirectory,
            'web/src/components/WaterfallBlogPostCell/WaterfallBlogPostCell'
          )
        )
      },
    },
  ]
}

module.exports = {
  getCellTasks,
}
