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

    return applyCodemod(
      'blogPostCell.js',
      fullPath('web/src/components/BlogPostCell/BlogPostCell')
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

  // add prerender to 3 routes
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
    const resultsRoutesNotFound = resultsRoutesHome.replace(
      /page={NotFoundPage}/,
      `page={NotFoundPage} prerender`
    )
    fs.writeFileSync(pathRoutes, resultsRoutesNotFound)
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

  const execaOptionsForProject = getExecaOptions(outputPath)

  const addDbAuth = async () => {
    await execa(
      'yarn rw setup auth dbAuth --force',
      [],
      getExecaOptions(outputPath)
    )

    if (linkWithLatestFwBuild) {
      await execa('yarn rwfw project:copy', [], getExecaOptions(outputPath))
    }

    await execa('yarn rw g dbAuth', [], getExecaOptions(outputPath))

    // add dbAuth User model
    const { user } = await import('./codemods/models.js')

    addModel(user)

    // update directive in contacts.sdl.ts
    const pathContactsSdl = `${OUTPUT_PATH}/api/src/graphql/contacts.sdl.ts`
    const contentContactsSdl = fs.readFileSync(pathContactsSdl, 'utf-8')
    const resultsContactsSdl = contentContactsSdl.replace(
      /createContact([^}]*)@requireAuth/,
      `createContact(input: CreateContactInput!): Contact @skipAuth`
    )
    fs.writeFileSync(pathContactsSdl, resultsContactsSdl)

    // update directive in contacts.sdl.ts
    const pathPostsSdl = `${OUTPUT_PATH}/api/src/graphql/posts.sdl.ts`
    const contentPostsSdl = fs.readFileSync(pathPostsSdl, 'utf-8')
    const resultsPostsSdl = contentPostsSdl.replace(
      /posts: \[Post!\]! @requireAuth([^}]*)@requireAuth/,
      `posts: [Post!]! @skipAuth
      post(id: Int!): Post @skipAuth`
    )
    fs.writeFileSync(pathPostsSdl, resultsPostsSdl)

    // Update src/lib/auth to return roles, so tsc doesn't complain
    const libAuthPath = `${OUTPUT_PATH}/api/src/lib/auth.ts`
    const libAuthContent = fs.readFileSync(libAuthPath, 'utf-8')
    const newLibAuthContent = libAuthContent.replace(
      'select: { id: true }',
      'select: { id: true, roles: true }'
    )
    fs.writeFileSync(libAuthPath, newLibAuthContent)

    // update requireAuth test
    const pathRequireAuth = `${OUTPUT_PATH}/api/src/directives/requireAuth/requireAuth.test.ts`
    const contentRequireAuth = fs.readFileSync(pathRequireAuth).toString()
    const resultsRequireAuth = contentRequireAuth.replace(
      /const mockExecution([^}]*){} }\)/,
      `const mockExecution = mockRedwoodDirective(requireAuth, {
        context: { currentUser: { id: 1, roles: 'ADMIN' } },
      })`
    )
    fs.writeFileSync(pathRequireAuth, resultsRequireAuth)

    // remove unused userAttributes
    const pathAuthJs = `${OUTPUT_PATH}/api/src/functions/auth.ts`
    const contentAuthJs = fs.readFileSync(pathAuthJs).toString()
    const resultsAuthJs = contentAuthJs.replace(
      /handler: \({ username,([^}]*)userAttributes }\) => {/,
      `handler: ({ username, hashedPassword, salt }) => {`
    )

    fs.writeFileSync(pathAuthJs, resultsAuthJs)

    await execa(
      'yarn rw prisma migrate dev --name dbAuth',
      [],
      getExecaOptions(outputPath)
    )
  }

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
            execaOptionsForProject
          )
        },
      },
      {
        title: 'Scaffoding post',
        task: async () => {
          return execa('yarn rw g scaffold post', [], execaOptionsForProject)
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
            execaOptionsForProject
          )

          await execa(`yarn rw g sdl contact`, [], execaOptionsForProject)

          await applyCodemod(
            'contactsSdl.js',
            fullPath('api/src/graphql/contacts.sdl')
          )
        },
      },
      {
        title: 'Adding createContact to contacts service',
        task: async () => {
          await applyCodemod(
            'contactsService.js',
            fullPath('api/src/services/contacts/contacts')
          )
        },
      },
      {
        title: 'Add dbAuth',
        task: async () => addDbAuth(),
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
