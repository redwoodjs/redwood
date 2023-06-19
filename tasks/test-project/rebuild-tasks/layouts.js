const {
  execAndStreamRedwoodCommand,
  execAndStreamCodemod,
  fullPath,
} = require('./util')

function getLayoutTasks(projectDirectory) {
  return [
    {
      title: 'blog',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'layout', 'blog'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'blogLayout.js',
          fullPath(projectDirectory, 'web/src/layouts/BlogLayout/BlogLayout')
        )
      },
    },
  ]
}

module.exports = {
  getLayoutTasks,
}
