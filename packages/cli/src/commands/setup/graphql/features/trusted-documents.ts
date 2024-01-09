import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { Listr } from 'listr2'
import { Project, SyntaxKind, type PropertyAssignment } from 'ts-morph'

import { recordTelemetryAttributes, prettifyFile } from '@redwoodjs/cli-helpers'
import { getConfigPath } from '@redwoodjs/project-config'

import { getPaths } from '../../../../lib'

export const command = 'trusted-documents'
export const description = 'Set up Trusted Documents for GraphQL'

export function builder() {}

export function updateGraphQLHandler(graphQlSourcePath: string) {
  // add import
  const project = new Project()

  const graphQlSourceFile =
    project.addSourceFileAtPathIfExists(graphQlSourcePath)

  if (!graphQlSourceFile) {
    console.error(
      `Unable to determine the GraphQL Handler source path for: ${path.join(
        functionsDir,
        'graphql.(js|ts)'
      )}`
    )
    return
  }

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
      'Unable to determine how to setup Trusted Documents in the GraphQL Handler. Please add it manually following https://docs.redwoodjs.com/docs/graphql/trusted-documents#configure-graphql-handler'
    )
  }

  return { graphQlSourceFileChanged, graphQlSourceFile, project }
}

export function updateRedwoodToml(redwoodTomlPath: string) {
  let newConfig = undefined

  const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
  const graphqlExists = originalTomlContent.includes('[graphql]')

  const trustedDocumentsExists =
    originalTomlContent.includes('trustedDocuments =') ||
    originalTomlContent.includes('trustedDocuments=')

  const fragmentsExists =
    originalTomlContent.includes('fragments =') ||
    originalTomlContent.includes('fragments=')

  if (trustedDocumentsExists) {
    console.info(
      'GraphQL Trusted Documents are already enabled in your Redwood project.'
    )
  } else if (graphqlExists && fragmentsExists) {
    const insertIndex = originalTomlContent.indexOf('fragments')
    const trustedDocuments = 'trustedDocuments = true\n  '
    newConfig =
      originalTomlContent.slice(0, insertIndex) +
      trustedDocuments +
      originalTomlContent.slice(insertIndex)
  } else {
    if (!graphqlExists) {
      const tomlToAppend = `[graphql]\n  trustedDocuments = true`

      newConfig = originalTomlContent + '\n' + tomlToAppend
    } else {
      const graphqlIndex = originalTomlContent.indexOf('[graphql]')
      const insertIndex = graphqlIndex + '[graphql]\n'.length
      newConfig =
        originalTomlContent.slice(0, insertIndex) +
        '  trustedDocuments = true\n' +
        originalTomlContent.slice(insertIndex)
    }
  }

  return { newConfig, trustedDocumentsExists }
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
          `Unable to find the GraphQL Handler source file: ${path.join(
            functionsDir,
            'graphql.(js|ts)'
          )}`
        )
        return
      }

      const { project, graphQlSourceFileChanged } =
        updateGraphQLHandler(graphQlSourcePath)

      if (graphQlSourceFileChanged) {
        await project.save()
        prettifyFile(graphQlSourcePath, 'babel-ts')
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
    command: 'setup graphql trusted-documents',
    force,
    install,
  })

  const tasks = new Listr(
    [
      {
        title:
          'Update Redwood Project Configuration to enable GraphQL Trusted Documents ...',
        task: () => {
          const redwoodTomlPath = getConfigPath()

          const { newConfig, trustedDocumentsExists } =
            updateRedwoodToml(redwoodTomlPath)

          if (newConfig && (force || !trustedDocumentsExists)) {
            fs.writeFileSync(redwoodTomlPath, newConfig, 'utf-8')
          }
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
    console.error(e.message)
    process.exit(e?.exitCode || 1)
  }
}
