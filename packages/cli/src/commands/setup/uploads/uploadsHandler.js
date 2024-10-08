import path from 'path'

import fs from 'fs-extra'
import { Listr } from 'listr2'
import { format } from 'prettier'

import { addApiPackages, getPrettierOptions } from '@redwoodjs/cli-helpers'
import { generate as generateTypes } from '@redwoodjs/internal/dist/generate/generate'
import { getConfig } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'
const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf-8'),
)

export async function handler({ force, verbose }) {
  const redwoodPaths = getPaths()
  const ts = isTypeScriptProject()
  const projectName = getConfig().web.title

  const tasks = new Listr(
    [
      addApiPackages([`@redwoodjs/uploads@${version}`]),
      {
        title: 'Adding the upload directive ...',
        task: async () => {
          const uploadsDirectiveTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'api',
              'directives',
              'uploads.ts.template',
            ),
            'utf-8',
          )

          const uploadsDirectiveFile = path.join(
            redwoodPaths.api.directives,
            'uploads',
            'uploads.ts',
          )

          const directiveContent = ts
            ? uploadsDirectiveTemplateContent
            : await transformTSToJS(
                uploadsDirectiveFile,
                uploadsDirectiveTemplateContent,
              )

          return [
            writeFile(uploadsDirectiveFile, directiveContent, {
              overwriteExisting: force,
            }),
          ]
        },
      },
      {
        title: 'Adding uploads sdl and service ...',
        task: async () => {
          // sdl

          const uploadSdlTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'api',
              'sdl',
              `redwoodUploads.sdl.template`,
            ),
            'utf-8',
          )

          const sdlFile = path.join(
            redwoodPaths.api.graphql,
            `redwoodUploads.sdl.${isTypeScriptProject() ? 'ts' : 'js'}`,
          )

          const sdlContent = ts
            ? uploadSdlTemplateContent
            : await transformTSToJS(sdlFile, uploadSdlTemplateContent)

          // service

          const exampleServiceTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'api',
              'services',
              `redwoodUploads.ts.template`,
            ),
            'utf-8',
          )
          const serviceFile = path.join(
            redwoodPaths.api.services,
            'redwoodUploads',
            `redwoodUploads.${isTypeScriptProject() ? 'ts' : 'js'}`,
          )

          const serviceContent = ts
            ? exampleServiceTemplateContent
            : await transformTSToJS(serviceFile, exampleServiceTemplateContent)

          // types

          const typesTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'api',
              'services',
              `types.ts.template`,
            ),
            'utf-8',
          )
          let typesFile
          let typesContent

          if (isTypeScriptProject()) {
            typesFile = path.join(
              redwoodPaths.api.services,
              'redwoodUploads',
              `types.${isTypeScriptProject() ? 'ts' : 'js'}`,
            )

            typesContent = ts
              ? typesTemplateContent
              : await transformTSToJS(typesFile, typesTemplateContent)
          }
          // write all files
          return [
            writeFile(sdlFile, sdlContent, {
              overwriteExisting: force,
            }),
            writeFile(serviceFile, serviceContent, {
              overwriteExisting: force,
            }),
            isTypeScriptProject() &&
              writeFile(typesFile, typesContent, {
                overwriteExisting: force,
              }),
          ]
        },
      },
      {
        title: 'Adding the uploads plugin to the graphql server ...',
        task: async () => {
          const graphqlFunctionFile = path.join(
            redwoodPaths.api.functions,
            `graphql.${isTypeScriptProject() ? 'ts' : 'js'}`,
          )

          // Read the graphql function file
          let graphqlFunctionContent = fs.readFileSync(
            graphqlFunctionFile,
            'utf-8',
          )

          // Add import statement at the top of the file
          const importStatement = `import { useRedwoodUploads } from '@redwoodjs/uploads'

//
// In extraPlugins setup useRedwoodUpload
// extraPlugins: [
//   useRedwoodUpload({
//     appName: '${projectName}',
//   }),
// ]
//

`

          graphqlFunctionContent = importStatement + graphqlFunctionContent

          // Write the updated content back to the file
          await fs.writeFile(
            graphqlFunctionFile,
            graphqlFunctionContent,
            'utf-8',
          )
        },
      },
      {
        title: `Generating types ...`,
        task: async () => {
          await generateTypes()
          console.log(
            'Note: You may need to manually restart GraphQL in VSCode to see the new types take effect.\n\n',
          )
        },
      },

      {
        title: 'Prettifying changed files',
        task: async (_ctx, task) => {
          const ext = isTypeScriptProject() ? 'ts' : 'js'
          const prettifyPaths = [
            path.join(getPaths().api.directives, 'upload', `upload.${ext}`),
            path.join(getPaths().api.graphql, `redwoodUploads.sdl.${ext}`),
            path.join(
              getPaths().api.services,
              'redwoodUploads',
              `redwoodUploads.${ext}`,
            ),
            isTypeScriptProject() &&
              path.join(getPaths().api.services, 'types', `types.${ext}`),
            path.join(getPaths().api.functions, `graphql.${ext}`),
          ]

          for (const prettifyPath of prettifyPaths) {
            try {
              if (!fs.existsSync(prettifyPath)) {
                continue
              }
              const source = fs.readFileSync(prettifyPath, 'utf-8')
              const prettierOptions = await getPrettierOptions()
              const prettifiedApp = await format(source, {
                ...prettierOptions,
                parser: 'babel-ts',
              })

              fs.writeFileSync(prettifyPath, prettifiedApp, 'utf-8')
            } catch {
              task.output =
                "Couldn't prettify the changes. Please reformat the files manually if needed."
            }
          }
        },
      },
    ],
    {
      rendererOptions: { collapseSubtasks: false, persistentOutput: true },
      renderer: verbose ? 'verbose' : 'default',
    },
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
