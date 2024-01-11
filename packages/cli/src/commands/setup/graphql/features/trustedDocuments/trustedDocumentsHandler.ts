import fs from 'fs'

import toml from '@iarna/toml'
import execa from 'execa'
import { Listr } from 'listr2'
import { Project, SyntaxKind, type PropertyAssignment } from 'ts-morph'

import { prettifyFile } from '@redwoodjs/cli-helpers'
import { getConfigPath, getPaths } from '@redwoodjs/project-config'

export function updateGraphQLHandler(graphQlSourcePath: string) {
  // add import
  const project = new Project()

  const graphQlSourceFile =
    project.addSourceFileAtPathIfExists(graphQlSourcePath)

  if (!graphQlSourceFile) {
    console.error(
      `Unable to determine the GraphQL Handler source path for: ${graphQlSourcePath}`
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
  const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
  const redwoodTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
  // Can't type toml.parse because this PR has not been included in a released yet
  // https://github.com/iarna/iarna-toml/commit/5a89e6e65281e4544e23d3dbaf9e8428ed8140e9
  const redwoodTomlObject = toml.parse(redwoodTomlContent) as any
  const hasExistingGraphqlSection = !!redwoodTomlObject?.graphql

  if (redwoodTomlObject?.graphql?.trustedDocuments) {
    console.info(
      'GraphQL Trusted Documents are already enabled in your Redwood project.'
    )

    return { newConfig: undefined, trustedDocumentsExists: true }
  }

  let newTomlContent =
    originalTomlContent.replace(/\n$/, '') +
    '\n\n[graphql]\n  trustedDocuments = true'

  if (hasExistingGraphqlSection) {
    const existingGraphqlSetting = Object.keys(redwoodTomlObject.graphql)

    let inGraphqlSection = false
    let indentation = ''
    let lastGraphqlSettingIndex = 0

    const tomlLines = originalTomlContent.split('\n')
    tomlLines.forEach((line, index) => {
      if (line.startsWith('[graphql]')) {
        inGraphqlSection = true
        lastGraphqlSettingIndex = index
      } else {
        if (/^\s*\[/.test(line)) {
          inGraphqlSection = false
        }
      }

      if (inGraphqlSection) {
        const matches = line.match(
          new RegExp(`^(\\s*)(${existingGraphqlSetting})\\s*=`, 'i')
        )

        if (matches) {
          indentation = matches[1]
        }

        if (/^\s*\w+\s*=/.test(line)) {
          lastGraphqlSettingIndex = index
        }
      }
    })

    tomlLines.splice(
      lastGraphqlSettingIndex + 1,
      0,
      `${indentation}trustedDocuments = true`
    )

    newTomlContent = tomlLines.join('\n')
  }

  return { newConfig: newTomlContent, trustedDocumentsExists: false }
}

async function configureGraphQLHandlerWithStore() {
  const graphQlSourcePath = getPaths().api.graphql

  const updateResult = updateGraphQLHandler(graphQlSourcePath)

  if (updateResult?.graphQlSourceFileChanged) {
    await updateResult?.project.save()
    prettifyFile(graphQlSourcePath, 'babel-ts')
  }
}

export async function handler({ force }: { force: boolean }) {
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
      {
        title:
          'Configuring the GraphQL Handler to use a Trusted Documents store ...',
        task: async () => {
          return configureGraphQLHandlerWithStore()
        },
      },
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
