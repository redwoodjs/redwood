const {
  execAndStreamRedwoodCommand,
  execAndStreamCodemod,
  fullPath,
} = require('./util')

function getComponentTasks(projectDirectory) {
  return [
    {
      title: 'blog post',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'component', 'blogPost'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'blogPost.js',
          fullPath(projectDirectory, 'web/src/components/BlogPost/BlogPost')
        )
      },
    },
    {
      title: 'author',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'component', 'author'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'author.js',
          fullPath(projectDirectory, 'web/src/components/Author/Author')
        )
        await execAndStreamCodemod(
          task,
          'updateAuthorStories.js',
          fullPath(projectDirectory, 'web/src/components/Author/Author.stories')
        )
        await execAndStreamCodemod(
          task,
          'updateAuthorTest.js',
          fullPath(projectDirectory, 'web/src/components/Author/Author.test')
        )
      },
    },
  ]
}

module.exports = {
  getComponentTasks,
}
