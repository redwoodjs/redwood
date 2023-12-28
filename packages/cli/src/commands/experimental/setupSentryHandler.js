import path from 'path'

import fs from 'fs-extra'
import { Listr } from 'listr2'

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
import { getConfigPath } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { writeFile } from '../../lib'

const PATHS = getPaths()

export const handler = async ({ force }) => {
  const extension = isTypeScriptProject ? 'ts' : 'js'

  const notes = []

  const tasks = new Listr([
    addApiPackages(['@envelop/sentry@5', '@sentry/node@7']),
    addWebPackages(['@sentry/react@7', '@sentry/browser@7']),
    addEnvVarTask(
      'SENTRY_DSN',
      '',
      'https://docs.sentry.io/product/sentry-basics/dsn-explainer/'
    ),
    {
      title: 'Setting up Sentry on the API and web sides',
      task: () =>
        writeFilesTask(
          {
            [path.join(PATHS.api.lib, `sentry.${extension}`)]: fs
              .readFileSync(
                path.join(__dirname, 'templates/sentryApi.ts.template')
              )
              .toString(),
            [path.join(PATHS.web.src, 'lib', `sentry.${extension}`)]: fs
              .readFileSync(
                path.join(__dirname, 'templates/sentryWeb.ts.template')
              )
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
          'extraPlugins: [useSentry({',
          'includeRawResult: true,',
          'includeResolverArgs: true,',
          'includeExecuteVariables: true,',
          '})],'
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
      title: 'Adding config to redwood.toml...',
      task: (_ctx, task) => {
        const redwoodTomlPath = getConfigPath()
        const configContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
        if (!configContent.includes('[experimental.sentry]')) {
          // Use string replace to preserve comments and formatting
          writeFile(
            redwoodTomlPath,
            configContent.concat(`\n[experimental.sentry]\n\tenabled = true\n`),
            {
              overwriteExisting: true, // redwood.toml always exists
            }
          )
        } else {
          task.skip(
            `The [experimental.sentry] config block already exists in your 'redwood.toml' file.`
          )
        }
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
            "Check out RedwoodJS forums' for more: https://community.redwoodjs.com/t/sentry-error-and-performance-monitoring-experimental/4880"
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
