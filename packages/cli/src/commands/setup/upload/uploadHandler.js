import path from 'path'

import fs from 'fs-extra'
import { Listr } from 'listr2'

import { addApiPackages } from '@redwoodjs/cli-helpers'
import { generate as generateTypes } from '@redwoodjs/internal/dist/generate/generate'
import { getConfig } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'
const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf-8'),
)

export async function handler({ force, includeExamples, verbose }) {
  const redwoodPaths = getPaths()
  const ts = isTypeScriptProject()
  const projectName = getConfig().web.title

  const tasks = new Listr(
    [
      addApiPackages([`@redwoodjs/upload@${version}`]),
      // add the upload directive
      {
        title: 'Adding the upload api lib ...',
        task: async () => {
          const uploadDirectiveTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'api',
              'directives',
              'upload.ts.template',
            ),
            'utf-8',
          )

          const uploadDirectiveFile = path.join(
            redwoodPaths.api.directives,
            'upload.ts',
          )

          const directiveContent = ts
            ? uploadDirectiveTemplateContent
            : await transformTSToJS(
                uploadDirectiveFile,
                uploadDirectiveTemplateContent,
              )

          return [
            writeFile(uploadDirectiveFile, directiveContent, {
              overwriteExisting: force,
            }),
          ]
        },
      },
      // add the upload sdl and service
      {
        title: 'Adding Upload sdl and service ...',
        enabled: () => includeExamples,
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

          // write all files
          return [
            writeFile(sdlFile, sdlContent, {
              overwriteExisting: force,
            }),
            writeFile(serviceFile, serviceContent, {
              overwriteExisting: force,
            }),
          ]
        },
      },
      // add the upload plugin to the graphql server
      {
        title: 'Adding the upload plugin to the graphql server ...',
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
          const importStatement = `import { createUploadDirective } from '@redwoodjs/upload'

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
