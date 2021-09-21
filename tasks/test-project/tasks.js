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

async function webTasks(outputPath, { link, verbose }) {
  OUTPUT_PATH = outputPath

  const execaOptions = getExecaOptions(outputPath)

  const createBuilder = (cmd) => {
    return async function createItem(name) {
      await execa(`${cmd} ${name}`, [], execaOptions)
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

    applyCodemod(
      'blogPostsCell.js',
      fullPath('web/src/components/BlogPostsCell/BlogPostsCell')
    )

    await createCell('blogPost')

    return applyCodemod(
      'blogPostCell.js',
      fullPath('web/src/components/BlogPostCell/BlogPostCell')
    )
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
        title: 'Changing routes',
        task: () => applyCodemod('routes.js', fullPath('web/src/Routes')),
      },

      // ====== NOTE: rufus needs this workaround for tailwind =======
      // Setup tailwind in a linked project, due to rwfw we install deps manually
      {
        title: 'Install tailwind dependencies',
        // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
        task: () =>
          execa(
            'yarn workspace web add postcss postcss-loader tailwindcss autoprefixer',
            [],
            getExecaOptions(outputPath)
          ),
        enabled: () => link,
      },
      {
        title: '[link] Copy local framework files again',
        // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
        task: () =>
          execa('yarn rwfw project:copy', [], getExecaOptions(outputPath)),
        enabled: () => link,
      },
      // =========
      {
        title: 'Adding Tailwind',
        task: () => {
          return execa(
            'yarn rw setup tailwind',
            ['--force', link && '--no-install'].filter(Boolean),
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

async function apiTasks(outputPath, { verbose }) {
  OUTPUT_PATH = outputPath

  const execaOptionsForProject = getExecaOptions(outputPath)

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
        title: 'Seeding database',
        task: async () => {
          await applyCodemod(
            'seed.js',
            fullPath('api/db/seed.js', { addExtension: false }) // seed.js is seed.js in a TS project too
          )

          return execa('yarn rw prisma db seed', [], execaOptionsForProject)
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
