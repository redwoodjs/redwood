/* eslint-env node, es6*/
const fs = require('fs')
const path = require('path')

const execa = require('execa')
const Listr = require('listr')
const VerboseRenderer = require('listr-verbose-renderer')

const { getExecaOptions, applyCodemod } = require('./util')

// This variable gets used in other functions
// and is set when webTasks or apiTasks are called
let OUTPUT_PATH

function fullPath(name, { addExtension } = { addExtension: true }) {
  if (addExtension) {
    if (name.startsWith('api')) {
      name += '.ts'
    } else if (name.startsWith('web')) {
      name += '.tsx'
    }
  }

  return path.join(OUTPUT_PATH, name)
}

async function webTasks(outputPath, { linkWithLatestFwBuild, verbose }) {
  OUTPUT_PATH = outputPath

  const execaOptions = getExecaOptions(outputPath)

  const createBuilder = (cmd) => {
    return async function createItem(positionals) {
      await execa(
        cmd,
        Array.isArray(positionals) ? positionals : [positionals],
        execaOptions
      )
    }
  }

  const createPages = async () => {
    const createPage = createBuilder('yarn redwood g page')

    return new Listr([
      {
        title: 'Creating home page',
        task: async () => {
          await createPage('home /')

          return applyCodemod(
            'homePage.js',
            fullPath('web/src/pages/HomePage/HomePage')
          )
        },
      },
      {
        title: 'Creating about page',
        task: async () => {
          await createPage('about')

          return applyCodemod(
            'aboutPage.js',
            fullPath('web/src/pages/AboutPage/AboutPage')
          )
        },
      },
      {
        title: 'Creating contact page',
        task: async () => {
          await createPage('contact')

          return applyCodemod(
            'contactPage.js',
            fullPath('web/src/pages/ContactPage/ContactPage')
          )
        },
      },
      {
        title: 'Creating blog post page',
        task: async () => {
          await createPage('blogPost /blog-post/{id:Int}')

          return applyCodemod(
            'blogPostPage.js',
            fullPath('web/src/pages/BlogPostPage/BlogPostPage')
          )
        },
      },
      {
        title: 'Creating profile page',
        task: async () => {
          await createPage('profile /profile')

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
            fullPath('web/src/pages/ProfilePage/ProfilePage.test'),
            testFileContent
          )

          return applyCodemod(
            'profilePage.js',
            fullPath('web/src/pages/ProfilePage/ProfilePage')
          )
        },
      },
      {
        title: 'Creating MDX Storybook stories',
        task: () => {
          const redwoodMdxStoryContent = fs.readFileSync(
            `${path.resolve(__dirname, 'codemods', 'Redwood.stories.mdx')}`
          )

          fs.writeFileSync(
            fullPath('web/src/Redwood.stories.mdx', { addExtension: false }),
            redwoodMdxStoryContent
          )

          return
        },
      },
    ])
  }

  const createLayout = async () => {
    const createLayout = createBuilder('yarn redwood g layout')

    await createLayout('blog')

    return applyCodemod(
      'blogLayout.js',
      fullPath('web/src/layouts/BlogLayout/BlogLayout')
    )
  }

  const createComponents = async () => {
    const createComponent = createBuilder('yarn redwood g component')

    await createComponent('blogPost')

    return applyCodemod(
      'blogPost.js',
      fullPath('web/src/components/BlogPost/BlogPost')
    )
  }

  const createCells = async () => {
    const createCell = createBuilder('yarn redwood g cell')

    await createCell('blogPosts')

    await applyCodemod(
      'blogPostsCell.js',
      fullPath('web/src/components/BlogPostsCell/BlogPostsCell')
    )

    await createCell('blogPost')

    await applyCodemod(
      'blogPostCell.js',
      fullPath('web/src/components/BlogPostCell/BlogPostCell')
    )

    await createCell('author')

    return applyCodemod(
      'authorCell.js',
      fullPath('web/src/components/AuthorCell/AuthorCell')
    )
  }

  const updateCellMocks = async () => {
    await applyCodemod(
      'updateBlogPostMocks.js',
      fullPath('web/src/components/BlogPostCell/BlogPostCell.mock.ts', {
        addExtension: false,
      })
    )

    return applyCodemod(
      'updateBlogPostMocks.js',
      fullPath('web/src/components/BlogPostsCell/BlogPostsCell.mock.ts', {
        addExtension: false,
      })
    )
  }

  // add prerender to some routes
  const pathRoutes = `${OUTPUT_PATH}/web/src/Routes.tsx`
  const addPrerender = async () => {
    const contentRoutes = fs.readFileSync(pathRoutes).toString()
    const resultsRoutesAbout = contentRoutes.replace(
      /name="about"/,
      `name="about" prerender`
    )
    const resultsRoutesHome = resultsRoutesAbout.replace(
      /name="home"/,
      `name="home" prerender`
    )
    const resultsRoutesBlogPost = resultsRoutesHome.replace(
      /name="blogPost"/,
      `name="blogPost" prerender`
    )
    const resultsRoutesNotFound = resultsRoutesBlogPost.replace(
      /page={NotFoundPage}/,
      `page={NotFoundPage} prerender`
    )
    fs.writeFileSync(pathRoutes, resultsRoutesNotFound)

    const prerenderTs = `import { db } from '$api/src/lib/db'

      export default async function pathParameterValues() {
        return {
          blogPost: (await db.post.findMany()).map((post) => ({ id: post.id })),
        }
      }
      `.replaceAll(/ {6}/g, '')
    const prerenderTsPath = `${OUTPUT_PATH}/scripts/prerender.ts`
    fs.writeFileSync(prerenderTsPath, prerenderTs)
  }

  return new Listr(
    [
      {
        title: 'Creating pages',
        task: () => createPages(),
      },
      {
        title: 'Creating layout',
        task: () => createLayout(),
      },
      {
        title: 'Creating components',
        task: () => createComponents(),
      },
      {
        title: 'Creating cells',
        task: () => createCells(),
      },
      {
        title: 'Updating cell mocks',
        task: () => updateCellMocks(),
      },
      {
        title: 'Changing routes',
        task: () => applyCodemod('routes.js', fullPath('web/src/Routes')),
      },
      {
        title: 'Add Prerender to Routes',
        task: () => addPrerender(),
      },

      // ====== NOTE: rufus needs this workaround for tailwind =======
      // Setup tailwind in a linked project, due to rwfw we install deps manually
      {
        title: 'Install tailwind dependencies',
        // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
        task: () =>
          execa(
            'yarn workspace web add -D postcss postcss-loader tailwindcss autoprefixer',
            [],
            getExecaOptions(outputPath)
          ),
        enabled: () => linkWithLatestFwBuild,
      },
      {
        title: '[link] Copy local framework files again',
        // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
        task: () =>
          execa('yarn rwfw project:copy', [], getExecaOptions(outputPath)),
        enabled: () => linkWithLatestFwBuild,
      },
      // =========
      {
        title: 'Adding Tailwind',
        task: () => {
          return execa(
            'yarn rw setup ui tailwindcss',
            ['--force', linkWithLatestFwBuild && '--no-install'].filter(
              Boolean
            ),
            execaOptions
          )
        },
      },
    ],
    {
      exitOnError: true,
      renderer: verbose && VerboseRenderer,
    }
  )
}

async function addModel(schema) {
  const path = `${OUTPUT_PATH}/api/db/schema.prisma`

  const current = fs.readFileSync(path)

  fs.writeFileSync(path, `${current}\n\n${schema}`)
}

async function apiTasks(outputPath, { verbose, linkWithLatestFwBuild }) {
  OUTPUT_PATH = outputPath

  const execaOptions = getExecaOptions(outputPath)

  const createBuilder = (cmd) => {
    return async function createItem(positionals) {
      await execa(
        cmd,
        Array.isArray(positionals) ? positionals : [positionals],
        execaOptions
      )
    }
  }

  const addDbAuth = async () => {
    await execa('yarn rw setup auth dbAuth --force', [], execaOptions)

    if (linkWithLatestFwBuild) {
      await execa('yarn rwfw project:copy', [], execaOptions)
    }

    await execa('yarn rw g dbAuth', [], execaOptions)

    // add dbAuth User model
    const { user } = await import('./codemods/models.js')

    addModel(user)

    // update directive in contacts.sdl.ts
    const pathContactsSdl = `${OUTPUT_PATH}/api/src/graphql/contacts.sdl.ts`
    const contentContactsSdl = fs.readFileSync(pathContactsSdl, 'utf-8')
    const resultsContactsSdl = contentContactsSdl
      .replace(
        'createContact(input: CreateContactInput!): Contact! @requireAuth',
        `createContact(input: CreateContactInput!): Contact @skipAuth`
      )
      .replace(
        'deleteContact(id: Int!): Contact! @requireAuth',
        'deleteContact(id: Int!): Contact! @requireAuth(roles:["ADMIN"])'
      ) // make deleting contacts admin only
    fs.writeFileSync(pathContactsSdl, resultsContactsSdl)

    // update directive in posts.sdl.ts
    const pathPostsSdl = `${OUTPUT_PATH}/api/src/graphql/posts.sdl.ts`
    const contentPostsSdl = fs.readFileSync(pathPostsSdl, 'utf-8')
    const resultsPostsSdl = contentPostsSdl.replace(
      /posts: \[Post!\]! @requireAuth([^}]*)@requireAuth/,
      `posts: [Post!]! @skipAuth
      post(id: Int!): Post @skipAuth`
    ) // make posts accessible to all

    fs.writeFileSync(pathPostsSdl, resultsPostsSdl)

    // Update src/lib/auth to return roles, so tsc doesn't complain
    const libAuthPath = `${OUTPUT_PATH}/api/src/lib/auth.ts`
    const libAuthContent = fs.readFileSync(libAuthPath, 'utf-8')

    const newLibAuthContent = libAuthContent
      .replace(
        'select: { id: true }',
        'select: { id: true, roles: true, email: true}'
      )
      .replace(
        'const currentUserRoles = context.currentUser?.roles',
        'const currentUserRoles = context.currentUser?.roles as string | string[]'
      )
    fs.writeFileSync(libAuthPath, newLibAuthContent)

    // update requireAuth test
    const pathRequireAuth = `${OUTPUT_PATH}/api/src/directives/requireAuth/requireAuth.test.ts`
    const contentRequireAuth = fs.readFileSync(pathRequireAuth).toString()
    const resultsRequireAuth = contentRequireAuth.replace(
      /const mockExecution([^}]*){} }\)/,
      `const mockExecution = mockRedwoodDirective(requireAuth, {
        context: { currentUser: { id: 1, roles: 'ADMIN', email: 'b@zinga.com' } },
      })`
    )
    fs.writeFileSync(pathRequireAuth, resultsRequireAuth)

    // add fullName input to signup form
    const pathSignupPageTs = `${OUTPUT_PATH}/web/src/pages/SignupPage/SignupPage.tsx`
    const contentSignupPageTs = fs.readFileSync(pathSignupPageTs, 'utf-8')
    const usernameFields = contentSignupPageTs.match(
      /\s*<Label[\s\S]*?name="username"[\s\S]*?"rw-field-error" \/>/
    )[0]
    const fullNameFields = usernameFields
      .replace(/\s*ref=\{usernameRef}/, '')
      .replaceAll('username', 'full-name')
      .replaceAll('Username', 'Full Name')

    const newContentSignupPageTs = contentSignupPageTs.replace(
      '<FieldError name="password" className="rw-field-error" />',
      '<FieldError name="password" className="rw-field-error" />\n' +
        fullNameFields
    )

    fs.writeFileSync(pathSignupPageTs, newContentSignupPageTs)

    // set fullName when signing up
    const pathAuthTs = `${OUTPUT_PATH}/api/src/functions/auth.ts`
    const contentAuthTs = fs.readFileSync(pathAuthTs).toString()
    const resultsAuthTs = contentAuthTs.replace(
      '// name: userAttributes.name',
      "fullName: userAttributes['full-name']"
    )

    fs.writeFileSync(pathAuthTs, resultsAuthTs)

    await execa('yarn rw prisma migrate dev --name dbAuth', [], execaOptions)
  }

  const generateScaffold = createBuilder('yarn rw g scaffold')

  return new Listr(
    [
      {
        title: 'Adding post model to prisma',
        task: async () => {
          const { post } = await import('./codemods/models.js')

          addModel(post)

          return execa(
            `yarn rw prisma migrate dev --name create_product`,
            [],
            execaOptions
          )
        },
      },
      {
        title: 'Scaffolding post',
        task: async () => {
          return generateScaffold('post')
        },
      },
      {
        title: 'Adding seed script',
        task: async () => {
          await applyCodemod(
            'seed.js',
            fullPath('scripts/seed.ts', { addExtension: false })
          )
        },
      },
      {
        title: 'Adding contact model to prisma',
        task: async () => {
          const { contact } = await import('./codemods/models.js')

          addModel(contact)

          await execa(
            `yarn rw prisma migrate dev --name create_contact`,
            [],
            execaOptions
          )

          return generateScaffold('contacts')
        },
      },
      {
        title: 'Add dbAuth',
        task: async () => addDbAuth(),
      },
      {
        title: 'Add users service',
        task: async () => {
          const generateSdl = createBuilder('yarn redwood g sdl --no-crud')

          await generateSdl('user')

          await applyCodemod(
            'usersSdl.js',
            fullPath('api/src/graphql/users.sdl')
          )

          await applyCodemod(
            'usersService.js',
            fullPath('api/src/services/users/users')
          )

          return createBuilder('yarn redwood g types')()
        },
      },
    ],
    {
      exitOnError: true,
      renderer: verbose && VerboseRenderer,
    }
  )
}

module.exports = {
  apiTasks,
  webTasks,
}
