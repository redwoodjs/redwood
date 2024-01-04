import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { Listr } from 'listr2'
import { format } from 'prettier'
import { Project, SyntaxKind, type PropertyAssignment } from 'ts-morph'

import {
  recordTelemetryAttributes,
  prettierOptions,
} from '@redwoodjs/cli-helpers'
import { getConfigPath } from '@redwoodjs/project-config'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'

export const command = 'trusted-docs'
export const description = 'Set up Trusted Documents for GraphQL'

export function builder(yargs: any) {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

function configureGraphQLHandlerWithStore() {
  return {
    title:
      'Configuring the GraphQL Handler to use a Trusted Documents store ...',
    task: async () => {
      // locate "api/functions/graphql.[js|ts]"
      let graphQlSourcePath: string | undefined
      const functionsDir = getPaths().api.functions
      if (fs.existsSync(path.join(functionsDir, 'graphql.ts'))) {
        graphQlSourcePath = path.join(functionsDir, 'graphql.ts')
      } else if (fs.existsSync(path.join(functionsDir, 'graphql.js'))) {
        graphQlSourcePath = path.join(functionsDir, 'graphql.js')
      }

      if (!graphQlSourcePath) {
        console.warn(
          c.warning(
            `Unable to find the GraphQL Handler source file: ${path.join(
              functionsDir,
              'graphql.(js|ts)'
            )}`
          )
        )
        return
      }

      // add import
      const project = new Project()
      const graphQlSourceFile =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        project.addSourceFileAtPathIfExists(graphQlSourcePath)!
      let graphQlSourceFileChanged = false
      let identified = false

      const imports = graphQlSourceFile.getImportDeclarations()
      if (
        !imports.some(
          (i) => i.getModuleSpecifierValue() === 'src/lib/trustedDocumentsStore'
        )
      ) {
        graphQlSourceFile.addImportDeclaration({
          moduleSpecifier: 'src/lib/trustedDocumentsStore',
          namedImports: ['store'],
        })
        graphQlSourceFileChanged = true
      }

      // add "trustedDocuments" option to `createGraphQLHandler` call
      graphQlSourceFile
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .forEach((expr) => {
          if (identified) {
            return
          }

          if (
            expr.getExpression().asKind(SyntaxKind.Identifier)?.getText() ===
            'createGraphQLHandler'
          ) {
            const arg = expr
              .getArguments()[0]
              ?.asKind(SyntaxKind.ObjectLiteralExpression)
            if (arg) {
              identified = true
              const props = arg.getProperties()
              const trustedDocsProp = props.find(
                (p): p is PropertyAssignment =>
                  p.asKind(SyntaxKind.PropertyAssignment)?.getName() ===
                  'trustedDocuments'
              )
              if (!trustedDocsProp) {
                arg.addPropertyAssignment({
                  name: 'trustedDocuments',
                  initializer: '{ store }',
                })
                graphQlSourceFileChanged = true
              }
            }
          }
        })

      if (!identified) {
        console.warn(
          c.warning(
            'Unable to determine how to setup Trusted Documents in the GraphQL Handler. Please add it manually following https://docs.redwoodjs.com/docs/graphql/trusted-documents#configure-graphql-handler'
          )
        )
      }

      if (graphQlSourceFileChanged) {
        await project.save()
        const updatedHandler = fs.readFileSync(graphQlSourcePath, 'utf-8')
        const prettifiedHandler = format(updatedHandler, {
          ...prettierOptions(),
          parser: 'babel-ts',
        })
        fs.writeFileSync(graphQlSourcePath, prettifiedHandler, 'utf-8')
      }
    },
  }
}

export async function handler({
  force,
  install,
}: {
  force: boolean
  install: boolean
}) {
  recordTelemetryAttributes({
    command: 'setup graphql trusted-docs',
    force,
    install,
  })

  const tasks = new Listr(
    [
      {
        title:
          'Update Redwood Project Configuration to enable GraphQL Trusted Documents ...',
        skip: () => false,
        task: () => {
          const redwoodTomlPath = getConfigPath()
          const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

          const tomlToAppend = `[graphql]\n  trustedDocuments = true`

          const newConfig = originalTomlContent + '\n' + tomlToAppend

          fs.writeFileSync(redwoodTomlPath, newConfig, 'utf-8')
        },
      },
      {
        title: 'Generating Trusted Documents store ...',
        task: () => {
          execa.commandSync('yarn redwood generate types', { stdio: 'ignore' })
        },
      },
      configureGraphQLHandlerWithStore(),
    ],
    { rendererOptions: { collapseSubtasks: false } }
  )

  try {
    await tasks.run()
  } catch (e: any) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
