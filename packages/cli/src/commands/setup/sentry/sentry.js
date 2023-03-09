import fs from 'fs'
import path from 'path'

import { Listr } from 'listr2'
import terminalLink from 'terminal-link'

import {
  addApiPackages,
  addEnvVarTask,
  addWebPackages,
  colors as c,
  getPaths,
  isTypeScriptProject,
  prettify,
  writeFilesTask,
} from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

export const command = 'sentry'

export const description = 'Support Sentry error and performance tracking'

const PATHS = getPaths()

export const builder = (yargs) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing sentry.js files',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'http://localhost:3000/docs/cli-commands#setup-sentry'
      )}`
    )
}

export const handler = async ({ force }) => {
  const extension = isTypeScriptProject ? 'ts' : 'js'

  const notes = []

  const tasks = new Listr([
    addApiPackages(['@envelop/sentry', '@sentry/node', '@sentry/tracing']),
    addWebPackages(['@sentry/react', '@sentry/tracing']),
    addEnvVarTask(
      'SENTRY_DSN',
      'https://XXXXXXX@XXXXXXX.ingest.sentry.io/XXXXXXX',
      'https://docs.sentry.io/product/sentry-basics/dsn-explainer/'
    ),
    {
      title: 'Setting up Sentry on the API and web sides',
      task: () =>
        writeFilesTask(
          {
            [path.join(PATHS.api.lib, `sentry.${extension}`)]: fs
              .readFileSync(path.join(__dirname, 'templates/api.ts.template'))
              .toString(),
            [path.join(PATHS.web.src, 'lib', `sentry.${extension}`)]: fs
              .readFileSync(path.join(__dirname, 'templates/web.ts.template'))
              .toString(),
          },
          { existingFiles: force ? 'OVERWRITE' : 'SKIP' }
        ),
    },
    {
      title: 'Implementing the Envelop plugin',
      task: (ctx) => {
        const graphqlHandlerPath = path.join(
          PATHS.api.functions,
          `graphql.${extension}`
        )

        const contentLines = fs
          .readFileSync(graphqlHandlerPath)
          .toString()
          .split('\n')

        const handlerIndex = contentLines.findLastIndex((line) =>
          /^export const handler = createGraphQLHandler\({/.test(line)
        )

        const pluginsIndex = contentLines.findLastIndex((line) =>
          /extraPlugins:/.test(line)
        )

        if (handlerIndex === -1 || pluginsIndex !== -1) {
          ctx.addEnvelopPluginSkipped = true
          return
        }

        contentLines.splice(
          handlerIndex,
          1,
          "import 'src/lib/sentry'",
          '',
          'export const handler = createGraphQLHandler({',
          'extraPlugins: [useSentry()],'
        )

        contentLines.splice(0, 0, "import { useSentry } from '@envelop/sentry'")

        fs.writeFileSync(
          graphqlHandlerPath,
          prettify('graphql.ts', contentLines.join('\n'))
        )
      },
    },
    {
      title: "Replacing Redwood's Error boundary",
      task: () => {
        const contentLines = fs
          .readFileSync(PATHS.web.app)
          .toString()
          .split('\n')

        const webImportIndex = contentLines.findLastIndex((line) =>
          /^import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs\/web'$/.test(
            line
          )
        )
        contentLines.splice(
          webImportIndex,
          1,
          "import { RedwoodProvider } from '@redwoodjs/web'"
        )

        const boundaryOpenIndex = contentLines.findLastIndex((line) =>
          /<FatalErrorBoundary page={FatalErrorPage}>/.test(line)
        )
        contentLines.splice(
          boundaryOpenIndex,
          1,
          '<Sentry.ErrorBoundary fallback={FatalErrorPage}>'
        )

        const boundaryCloseIndex = contentLines.findLastIndex((line) =>
          /<\/FatalErrorBoundary>/.test(line)
        )
        contentLines.splice(boundaryCloseIndex, 1, '</Sentry.ErrorBoundary>')

        contentLines.splice(0, 0, "import Sentry from 'src/lib/sentry'")

        fs.writeFileSync(
          PATHS.web.app,
          prettify('App.tsx', contentLines.join('\n'))
        )
      },
    },
    {
      title: 'One more thing...',
      task: (ctx) => {
        notes.push(
          c.green(
            'You will need to add `SENTRY_DSN` to `includeEnvironmentVariables` in redwood.toml.'
          )
        )

        if (ctx.addEnvelopPluginSkipped) {
          notes.push(
            `${c.underline(
              'Make sure you implement the Sentry Envelop plugin:'
            )} https://redwoodjs.com/docs/cli-commands#sentry-envelop-plugin`
          )
        } else {
          notes.push(
            "Check out RedwoodJS' docs for more: https://redwoodjs.com/docs/cli-commands#setup-sentry"
          )
        }
      },
    },
  ])

  try {
    await tasks.run()
    console.log(notes.join('\n'))
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
