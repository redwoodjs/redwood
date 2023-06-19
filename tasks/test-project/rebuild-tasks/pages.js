const fs = require('fs')
const path = require('path')

const {
  execAndStreamRedwoodCommand,
  execAndStreamCodemod,
  fullPath,
} = require('./util')

function getPageTasks(projectDirectory) {
  return [
    {
      title: 'home',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'page', 'home', '/'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'homePage.js',
          fullPath(projectDirectory, 'web/src/pages/HomePage/HomePage')
        )
      },
    },
    {
      title: 'about',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'page', 'about'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'aboutPage.js',
          fullPath(projectDirectory, 'web/src/pages/AboutPage/AboutPage')
        )
      },
    },
    {
      title: 'contact',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'page', 'contactUs', '/contact'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'contactUsPage.js',
          fullPath(
            projectDirectory,
            'web/src/pages/ContactUsPage/ContactUsPage'
          )
        )
      },
    },
    {
      title: 'blog post',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'page', 'blogPost', '/blog-post/{id:Int}'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'blogPostPage.js',
          fullPath(projectDirectory, 'web/src/pages/BlogPostPage/BlogPostPage')
        )
      },
    },
    {
      title: 'profile',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'page', 'profile', '/profile'],
          projectDirectory
        )

        // Update the profile page test
        const testFileContent = `import { render, waitFor, screen } from '@redwoodjs/testing/web'

        import ProfilePage from './ProfilePage'

        describe('ProfilePage', () => {
          it('renders successfully', async () => {
            mockCurrentUser({
              email: 'danny@bazinga.com',
              id: 84849020,
              roles: 'BAZINGA',
            })

            await waitFor(async () => {
              expect(() => {
                render(<ProfilePage />)
              }).not.toThrow()
            })

            expect(await screen.findByText('danny@bazinga.com')).toBeInTheDocument()
          })
        })
        `

        fs.writeFileSync(
          fullPath(
            projectDirectory,
            'web/src/pages/ProfilePage/ProfilePage.test'
          ),
          testFileContent
        )

        await execAndStreamCodemod(
          task,
          'profilePage.js',
          fullPath(projectDirectory, 'web/src/pages/ProfilePage/ProfilePage')
        )
      },
    },
    {
      title: 'MDX Storybook stories',
      task: () => {
        const redwoodMdxStoryContent = fs.readFileSync(
          `${path.resolve(__dirname, '..', 'codemods', 'Redwood.stories.mdx')}`
        )

        fs.writeFileSync(
          fullPath(projectDirectory, 'web/src/Redwood.stories.mdx', {
            addExtension: false,
          }),
          redwoodMdxStoryContent
        )
      },
    },
    {
      title: 'Nested cells test page',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'page', 'waterfall', '{id:Int}'],
          projectDirectory
        )
        await execAndStreamCodemod(
          task,
          'waterfallPage.js',
          fullPath(
            projectDirectory,
            'web/src/pages/WaterfallPage/WaterfallPage'
          )
        )
      },
    },
  ]
}

module.exports = {
  getPageTasks,
}
