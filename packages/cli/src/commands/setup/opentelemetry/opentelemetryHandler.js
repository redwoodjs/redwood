import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import { Listr } from 'listr2'

import { addApiPackages } from '@redwoodjs/cli-helpers'
import { getConfigPath } from '@redwoodjs/internal/dist/paths'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

export const handler = async ({ force, verbose, addPackage }) => {
  const ts = isTypeScriptProject()

  // Used in multiple tasks
  const opentelemetryScriptPath = `${getPaths().api.src}/opentelemetry.${
    ts ? 'ts' : 'js'
  }`

  // TODO: Consider extracting these from the templates? Consider version pinning?
  const opentelemetryPackages = [
    '@opentelemetry/api',
    '@opentelemetry/instrumentation',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-node',
    '@opentelemetry/semantic-conventions',
  ]

  const tasks = new Listr(
    [
      {
        title: 'Confirmation',
        task: async (_ctx, task) => {
          const confirmation = await task.prompt({
            type: 'Confirm',
            message: 'OpenTelemetry support is experimental. Continue?',
          })

          if (!confirmation) {
            throw new Error('User aborted')
          }
        },
      },
      {
        title: `Adding OpenTelemetry files...`,
        task: () => {
          const setupTemplateContent = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'opentelemetry.ts.template'),
            'utf-8'
          )
          const setupScriptContent = ts
            ? setupTemplateContent
            : transformTSToJS(opentelemetryScriptPath, setupTemplateContent)

          return [
            writeFile(opentelemetryScriptPath, setupScriptContent, {
              overwriteExisting: force,
            }),
          ]
        },
      },
      {
        title: 'Adding OpenTelemetry config to redwood.toml...',
        task: (_ctx, task) => {
          const redwoodTomlPath = getConfigPath()
          const configContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
          if (!configContent.includes('[opentelemetry]')) {
            // Use string replace to preserve comments and formatting
            writeFile(
              redwoodTomlPath,
              configContent.concat(
                `\n[opentelemetry]\n\tscriptPath = "${opentelemetryScriptPath}"`
              ),
              {
                overwriteExisting: true, // redwood.toml always exists
              }
            )
          } else {
            task.skip(
              `The [opentelemetry] config block already exists in your 'redwood.toml' file.`
            )
          }
        },
      },
      {
        ...addApiPackages(opentelemetryPackages),
        title: 'Adding @opentelemetry dependencies...',
        skip: () => {
          if (!addPackage) {
            return 'Skipping package install, you will need to add all necessary @opentelemetry packages manaually as a dependency on the api workspace'
          }
        },
      },
      {
        title: 'Envelop confirmation',
        task: async (ctx, task) => {
          const confirmation = await task.prompt({
            type: 'Confirm',
            message:
              'Do you wish to add the OpenTelemetry Envelop plugin for GraphQL Yoga?',
          })
          ctx.setupEnvelop ||= confirmation
        },
      },
      {
        title: 'Setup Envelop OpenTelemetry plugin...',
        enabled: (ctx) => {
          return ctx.setupEnvelop
        },
        task: (_ctx, task) => {
          const graphqlPath = path.join(
            getPaths().api.functions,
            `graphql.${ts ? 'ts' : 'js'}`
          )
          const graphqlContents = fs.readFileSync(graphqlPath, {
            encoding: 'utf-8',
            flag: 'r',
          })

          const envelopTemplateContent = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'envelop.ts.template'),
            'utf-8'
          )
          const envelopContent = ts
            ? envelopTemplateContent
            : transformTSToJS(graphqlPath, envelopTemplateContent)

          const splitPosition = graphqlContents.indexOf(
            '\n',
            graphqlContents.lastIndexOf('import')
          )
          const contentBefore = graphqlContents
            .slice(0, splitPosition)
            .trimEnd()
          const contentAfter = graphqlContents.slice(splitPosition).trimStart()
          let newGraphqlContents = [
            contentBefore,
            envelopContent,
            contentAfter,
          ].join('\n')

          if (graphqlContents.includes('extraPlugins')) {
            task.output = `You will have to manually update 'extraPlugins' to include the OpenTelemetry plugin within ${graphqlPath}`
          } else {
            const splitPosition = newGraphqlContents.indexOf(
              '\n',
              newGraphqlContents.lastIndexOf(
                'export const handler = createGraphQLHandler({'
              )
            )
            const contentBefore = newGraphqlContents
              .slice(0, splitPosition)
              .trimEnd()
            const contentAfter = newGraphqlContents
              .slice(splitPosition)
              .trimStart()
            newGraphqlContents = [
              contentBefore,
              'extraPlugins: [opentelemetryPlugin],',
              contentAfter,
            ].join('\n')
          }

          return [
            writeFile(graphqlPath, newGraphqlContents, {
              overwriteExisting: true, // We'll likely always already have this file in the project
            }),
            addApiPackages(['@envelop/opentelemetry']),
          ]
        },
        options: {
          persistentOutput: true,
        },
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...\n
          ${c.green('OpenTelemetry Support is still experimental!')}
          ${c.green('Please let us know if you find bugs or quirks.')}
          ${chalk.hex('#e8e8e8')(
            'https://github.com/redwoodjs/redwood/issues/new'
          )}
        `
        },
      },
    ],
    {
      rendererOptions: { collapse: false },
      renderer: verbose ? 'verbose' : 'default',
      ctx: {
        setupEnvelop: false, // Default value to hide envelop steps
      },
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
