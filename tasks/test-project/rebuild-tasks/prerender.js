const fs = require('fs')

const { execAndStreamRedwoodCommand, fullPath } = require('./util')

function getPrerenderTasks(OUTPUT_PROJECT_PATH) {
  return [
    {
      // We need to do this here, and not where we create the other pages, to
      // keep it outside of BlogLayout
      title: 'Creating double rendering test page',
      task: async (task) => {
        await execAndStreamRedwoodCommand(
          task,
          ['generate', 'page', 'double'],
          OUTPUT_PROJECT_PATH
        )

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
          fullPath(OUTPUT_PROJECT_PATH, 'web/src/pages/DoublePage/DoublePage'),
          doublePageContent
        )
      },
    },
    {
      title: 'Update Routes.tsx',
      task: () => {
        const pathRoutes = `${OUTPUT_PROJECT_PATH}/web/src/Routes.tsx`
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
        const blogPostRouteHooksPath = `${OUTPUT_PROJECT_PATH}/web/src/pages/BlogPostPage/BlogPostPage.routeHooks.ts`
        fs.writeFileSync(blogPostRouteHooksPath, blogPostRouteHooks)

        const waterfallRouteHooks = `export async function routeParameters() {
      return [{ id: 2 }]
    }
    `.replaceAll(/ {6}/g, '')
        const waterfallRouteHooksPath = `${OUTPUT_PROJECT_PATH}/web/src/pages/WaterfallPage/WaterfallPage.routeHooks.ts`
        fs.writeFileSync(waterfallRouteHooksPath, waterfallRouteHooks)
      },
    },
  ]
}

module.exports = {
  getPrerenderTasks,
}
