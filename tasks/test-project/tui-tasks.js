/* eslint-env node, es2021*/
//@ts-check
const fs = require('fs')
const path = require('path')

const {
  getExecaOptions: utilGetExecaOptions,
  // applyCodemod,
  updatePkgJsonScripts,
  exec,
} = require('./util')

/** @type {(string) => import('execa').Options} */
function getExecaOptions(cwd) {
  return { ...utilGetExecaOptions(cwd), stdio: 'pipe' }
}

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

// TODO: Import from ./util.js when everything is using @rwjs/tui
async function applyCodemod(codemod, target) {
  const args = [
    '--fail-on-error',
    '-t',
    `${path.resolve(__dirname, 'codemods', codemod)} ${target}`,
    '--parser',
    'tsx',
    '--verbose=2',
  ]

  args.push()

  const subprocess = exec(
    'yarn jscodeshift',
    args,
    getExecaOptions(path.resolve(__dirname))
  )

  return subprocess
}

/**
 * @param {string} cmd The command to run
 * @returns {((positionalArguments: string | string[]) => import('execa').ExecaChildProcess<string>)
 *           & (() => import('execa').ExecaChildProcess<string>)}
 */
const createBuilder = (cmd) => {
  const execaOptions = getExecaOptions(OUTPUT_PATH)

  return function (positionalArguments) {
    const subprocess = exec(
      cmd,
      Array.isArray(positionalArguments)
        ? positionalArguments
        : [positionalArguments],
      execaOptions
    )

    return subprocess
  }
}

async function webTasks(outputPath, { linkWithLatestFwBuild }) {
  OUTPUT_PATH = outputPath

  const execaOptions = getExecaOptions(outputPath)

  const createPages = async () => {
    const createPage = createBuilder('yarn redwood g page')

    /** @type import('./typing').TuiTaskList */
    const tuiTaskList = [
      {
        title: 'Creating home page',
        task: async () => {
          await createPage('home /')

          await applyCodemod(
            'homePage.js',
            fullPath('web/src/pages/HomePage/HomePage')
          )
        },
      },
      {
        title: 'Creating about page',
        task: async () => {
          await createPage('about')

          await applyCodemod(
            'aboutPage.js',
            fullPath('web/src/pages/AboutPage/AboutPage')
          )
        },
      },
      {
        title: 'Creating contact page',
        task: async () => {
          await createPage('contactUs /contact')

          await applyCodemod(
            'contactUsPage.js',
            fullPath('web/src/pages/ContactUsPage/ContactUsPage')
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
      {
        title: 'Creating nested cells test page',
        task: async () => {
          await createPage('waterfall {id:Int}')

          await applyCodemod(
            'waterfallPage.js',
            fullPath('web/src/pages/WaterfallPage/WaterfallPage')
          )
        },
      },
    ]

    return tuiTaskList
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

    await applyCodemod(
      'blogPost.js',
      fullPath('web/src/components/BlogPost/BlogPost')
    )

    await createComponent('author')

    await applyCodemod(
      'author.js',
      fullPath('web/src/components/Author/Author')
    )

    await applyCodemod(
      'updateAuthorStories.js',
      fullPath('web/src/components/Author/Author.stories')
    )

    await applyCodemod(
      'updateAuthorTest.js',
      fullPath('web/src/components/Author/Author.test')
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

    await applyCodemod(
      'authorCell.js',
      fullPath('web/src/components/AuthorCell/AuthorCell')
    )

    await createCell('waterfallBlogPost')

    return applyCodemod(
      'waterfallBlogPostCell.js',
      fullPath('web/src/components/WaterfallBlogPostCell/WaterfallBlogPostCell')
    )
  }

  const updateCellMocks = async () => {
    await applyCodemod(
      'updateBlogPostMocks.js',
      fullPath('web/src/components/BlogPostCell/BlogPostCell.mock.ts', {
        addExtension: false,
      })
    )

    await applyCodemod(
      'updateBlogPostMocks.js',
      fullPath('web/src/components/BlogPostsCell/BlogPostsCell.mock.ts', {
        addExtension: false,
      })
    )

    await applyCodemod(
      'updateAuthorCellMock.js',
      fullPath('web/src/components/AuthorCell/AuthorCell.mock.ts', {
        addExtension: false,
      })
    )

    return applyCodemod(
      'updateWaterfallBlogPostMocks.js',
      fullPath(
        'web/src/components/WaterfallBlogPostCell/WaterfallBlogPostCell.mock.ts',
        {
          addExtension: false,
        }
      )
    )
  }

  /** @type import('./typing').TuiTaskList */
  const tuiTaskList = [
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

    // ====== NOTE: rufus needs this workaround for tailwind =======
    // Setup tailwind in a linked project, due to rwfw we install deps manually
    {
      title: 'Install tailwind dependencies',
      // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
      task: async () => {
        await exec(
          'yarn workspace web add -D postcss postcss-loader tailwindcss autoprefixer prettier-plugin-tailwindcss@0.4.1',
          [],
          getExecaOptions(outputPath)
        )
      },
      enabled: () => linkWithLatestFwBuild,
    },
    {
      title: '[link] Copy local framework files again',
      // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
      task: async () => {
        await exec('yarn rwfw project:copy', [], getExecaOptions(outputPath))
      },
      enabled: () => linkWithLatestFwBuild,
    },
    // =========
    {
      title: 'Adding Tailwind',
      task: async () => {
        await exec(
          'yarn rw setup ui tailwindcss',
          ['--force', linkWithLatestFwBuild && '--no-install'].filter(Boolean),
          execaOptions
        )
      },
    },
  ] //,
  // TODO: Figure out what to do with this. It's from Listr, but TUI doesn't
  //       have anything like it (yet?)
  // {
  //   exitOnError: true,
  //   renderer: verbose && 'verbose',
  // }

  return tuiTaskList
}

async function addModel(schema) {
  const path = `${OUTPUT_PATH}/api/db/schema.prisma`

  const current = fs.readFileSync(path)

  fs.writeFileSync(path, `${current}\n\n${schema}`)
}

async function apiTasks(outputPath, { linkWithLatestFwBuild }) {
  OUTPUT_PATH = outputPath

  const execaOptions = getExecaOptions(outputPath)

  const addDbAuth = async () => {
    // Temporarily disable postinstall script
    updatePkgJsonScripts({
      projectPath: outputPath,
      scripts: {
        postinstall: '',
      },
    })

    const dbAuthSetupPath = path.join(
      outputPath,
      'node_modules',
      '@redwoodjs',
      'auth-dbauth-setup'
    )

    // At an earlier step we run `yarn rwfw project:copy` which gives us
    // auth-dbauth-setup@3.2.0 currently. We need that version to be a canary
    // version for auth-dbauth-api and auth-dbauth-web package installations
    // to work. So we remove the current version and add a canary version
    // instead.

    fs.rmSync(dbAuthSetupPath, { recursive: true, force: true })

    await exec(
      'yarn rw setup auth dbAuth --force --no-webauthn',
      [],
      execaOptions
    )

    // Restore postinstall script
    updatePkgJsonScripts({
      projectPath: outputPath,
      scripts: {
        postinstall: 'yarn rwfw project:copy',
      },
    })

    if (linkWithLatestFwBuild) {
      await exec('yarn rwfw project:copy', [], execaOptions)
    }

    await exec(
      'yarn rw g dbAuth --no-webauthn --username-label=username --password-label=password',
      [],
      execaOptions
    )

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
    )?.[0]
    const fullNameFields = usernameFields
      ?.replace(/\s*ref=\{usernameRef}/, '')
      ?.replaceAll('username', 'full-name')
      ?.replaceAll('Username', 'Full Name')

    const newContentSignupPageTs = contentSignupPageTs
      .replace(
        '<FieldError name="password" className="rw-field-error" />',
        '<FieldError name="password" className="rw-field-error" />\n' +
          fullNameFields
      )
      // include full-name in the data we pass to `signUp()`
      .replace(
        'password: data.password',
        "password: data.password, 'full-name': data['full-name']"
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
  }

  // add prerender to some routes
  const addPrerender = async () => {
    /** @type import('./typing').TuiTaskList */
    const tuiTaskList = [
      {
        // We need to do this here, and not where we create the other pages, to
        // keep it outside of BlogLayout
        title: 'Creating double rendering test page',
        task: async () => {
          const createPage = createBuilder('yarn redwood g page')
          await createPage('double')

          const doublePageContent = `import { MetaTags } from '@redwoodjs/web'

const DoublePage = () => {
  return (
    <>
      <MetaTags title="Double" description="Double page" />

      <h1 className="mb-1 mt-2 text-xl font-semibold">DoublePage</h1>
      <p>
        This page exists to make sure we don&apos;t regress on{' '}
        <a
          href="https://github.com/redwoodjs/redwood/issues/7757"
          className="text-blue-600 underline visited:text-purple-600 hover:text-blue-800"
          target="_blank"
          rel="noreferrer"
        >
          #7757
        </a>
      </p>
      <p>It needs to be a page that is not wrapped in a Set</p>
    </>
  )
}

export default DoublePage`

          fs.writeFileSync(
            fullPath('web/src/pages/DoublePage/DoublePage'),
            doublePageContent
          )
        },
      },
      {
        title: 'Update Routes.tsx',
        task: () => {
          const pathRoutes = `${OUTPUT_PATH}/web/src/Routes.tsx`
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
          const resultsRoutesWaterfall = resultsRoutesNotFound.replace(
            /page={WaterfallPage}/,
            `page={WaterfallPage} prerender`
          )
          const resultsRoutesDouble = resultsRoutesWaterfall.replace(
            'name="double"',
            'name="double" prerender'
          )
          const resultsRoutesNewContact = resultsRoutesDouble.replace(
            'name="newContact"',
            'name="newContact" prerender'
          )
          fs.writeFileSync(pathRoutes, resultsRoutesNewContact)

          const blogPostRouteHooks = `import { db } from '$api/src/lib/db'

      export async function routeParameters() {
        return (await db.post.findMany({ take: 7 })).map((post) => ({ id: post.id }))
      }
      `.replaceAll(/ {6}/g, '')
          const blogPostRouteHooksPath = `${OUTPUT_PATH}/web/src/pages/BlogPostPage/BlogPostPage.routeHooks.ts`
          fs.writeFileSync(blogPostRouteHooksPath, blogPostRouteHooks)

          const waterfallRouteHooks = `export async function routeParameters() {
        return [{ id: 2 }]
      }
      `.replaceAll(/ {6}/g, '')
          const waterfallRouteHooksPath = `${OUTPUT_PATH}/web/src/pages/WaterfallPage/WaterfallPage.routeHooks.ts`
          fs.writeFileSync(waterfallRouteHooksPath, waterfallRouteHooks)
        },
      },
    ]

    return tuiTaskList
  }

  const generateScaffold = createBuilder('yarn rw g scaffold')

  /** @type import('./typing').TuiTaskList */
  const tuiTaskList = [
    {
      title: 'Adding post model to prisma',
      task: async () => {
        // Need both here since they have a relation
        const { post, user } = await import('./codemods/models.js')

        addModel(post)
        addModel(user)

        return exec(
          `yarn rw prisma migrate dev --name create_post_user`,
          [],
          execaOptions
        )
      },
    },
    {
      title: 'Scaffolding post',
      task: async () => {
        await generateScaffold('post')

        // Replace the random numbers in the scenario with consistent values
        await applyCodemod(
          'scenarioValueSuffix.js',
          fullPath('api/src/services/posts/posts.scenarios')
        )

        await exec(`yarn rwfw project:copy`, [], execaOptions)
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

        await exec(
          `yarn rw prisma migrate dev --name create_contact`,
          [],
          execaOptions
        )

        await generateScaffold('contacts')
      },
    },
    {
      // This task renames the migration folders so that we don't have to deal with duplicates/conflicts when committing to the repo
      title: 'Adjust dates within migration folder names',
      task: () => {
        const migrationsFolderPath = path.join(
          OUTPUT_PATH,
          'api',
          'db',
          'migrations'
        )
        // Migration folders are folders which start with 14 digits because they have a yyyymmddhhmmss
        const migrationFolders = fs
          .readdirSync(migrationsFolderPath)
          .filter((name) => {
            return (
              name.match(/\d{14}.+/) &&
              fs.lstatSync(path.join(migrationsFolderPath, name)).isDirectory()
            )
          })
          .sort()
        const datetime = new Date('2022-01-01T12:00:00.000Z')
        migrationFolders.forEach((name) => {
          const datetimeInCorrectFormat =
            datetime.getFullYear() +
            ('0' + (datetime.getMonth() + 1)).slice(-2) +
            ('0' + datetime.getDate()).slice(-2) +
            '120000' // Time hardcoded to 12:00:00 to limit TZ issues
          fs.renameSync(
            path.join(migrationsFolderPath, name),
            path.join(
              migrationsFolderPath,
              `${datetimeInCorrectFormat}${name.substring(14)}`
            )
          )
          datetime.setDate(datetime.getDate() + 1)
        })
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

        await applyCodemod('usersSdl.js', fullPath('api/src/graphql/users.sdl'))

        await applyCodemod(
          'usersService.js',
          fullPath('api/src/services/users/users')
        )

        // Replace the random numbers in the scenario with consistent values
        await applyCodemod(
          'scenarioValueSuffix.js',
          fullPath('api/src/services/users/users.scenarios')
        )

        const test = `import { user } from './users'
            import type { StandardScenario } from './users.scenarios'

            describe('users', () => {
              scenario('returns a single user', async (scenario: StandardScenario) => {
                const result = await user({ id: scenario.user.one.id })

                expect(result).toEqual(scenario.user.one)
              })
            })`.replaceAll(/ {12}/g, '')

        fs.writeFileSync(fullPath('api/src/services/users/users.test'), test)

        return createBuilder('yarn redwood g types')()
      },
    },
    {
      // This is probably more of a web side task really, but the scaffolded
      // pages aren't generated until we get here to the api side tasks. So
      // instead of doing some up in the web side tasks, and then the rest
      // here I decided to move all of them here
      title: 'Add Prerender to Routes',
      task: () => addPrerender(),
    },
    {
      title: 'Add context tests',
      task: () => {
        const templatePath = path.join(
          __dirname,
          'templates',
          'api',
          'context.test.ts.template'
        )
        const projectPath = path.join(
          OUTPUT_PATH,
          'api',
          'src',
          '__tests__',
          'context.test.ts'
        )

        fs.mkdirSync(path.dirname(projectPath), { recursive: true })
        fs.writeFileSync(projectPath, fs.readFileSync(templatePath))
      },
    },
  ]
  // ],
  // TODO: Figure out what to do with this. It's from Listr, but TUI doesn't
  //       have anything like it (yet?)
  // {
  //   exitOnError: true,
  //   renderer: verbose && 'verbose',
  //   renderOptions: { collapseSubtasks: false },
  // }
  return tuiTaskList
}

module.exports = {
  apiTasks,
  webTasks,
}
