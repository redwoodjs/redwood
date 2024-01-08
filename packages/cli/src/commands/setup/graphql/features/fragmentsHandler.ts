import fs from 'fs'

import execa from 'execa'
import { Listr } from 'listr2'
import { format } from 'prettier'
import { Project, SyntaxKind } from 'ts-morph'

import {
  recordTelemetryAttributes,
  prettierOptions,
} from '@redwoodjs/cli-helpers'
import { colors } from '@redwoodjs/cli-helpers'
import { getConfigPath, getPaths } from '@redwoodjs/project-config'

import type { Args } from './fragments'

export const command = 'fragments'
export const description = 'Set up Fragments for GraphQL'

function addPossibleTypesImportToApp() {
  return {
    title:
      'Configuring the GraphQL Handler to use a Trusted Documents store ...',
    task: async () => {
      const project = new Project()
      const appPath = getPaths().web.app
      const appSourceFile = project.addSourceFileAtPathIfExists(appPath)
      let appSourceFileChanged = false

      if (!appSourceFile) {
        console.warn(
          colors.warning(
            `Unable to find the GraphQL Handler source file: ${appPath}`
          )
        )
        return
      }

      const imports = appSourceFile.getImportDeclarations()

      if (
        !imports.some(
          (i) => i.getModuleSpecifierValue() === '../graphql/possibleTypes'
        )
      ) {
        appSourceFile.addImportDeclaration({
          moduleSpecifier: '../graphql/possibleTypes',
          defaultImport: 'possibleTypes',
        })

        appSourceFileChanged = true
      }

      if (appSourceFileChanged) {
        await project.save()
        const updatedHandler = fs.readFileSync(appPath, 'utf-8')
        const prettifiedHandler = format(updatedHandler, {
          ...prettierOptions(),
          parser: 'babel-ts',
        })
        fs.writeFileSync(getPaths().web.app, prettifiedHandler, 'utf-8')
      }
    },
  }
}

function updateGraphQlCacheConfig() {
  return {
    title:
      'Configuring the GraphQL Handler to use a Trusted Documents store ...',
    task: async () => {
      const project = new Project()
      const appPath = getPaths().web.app
      const appSourceFile = project.addSourceFileAtPathIfExists(appPath)
      const appSourceFileChanged = false

      if (!appSourceFile) {
        console.warn(
          colors.warning(
            `Unable to find the GraphQL Handler source file: ${appPath}`
          )
        )

        return
      }

      // Find the RedwoodApolloProvider component
      const redwoodApolloProvider = appSourceFile
        .getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
        .find((element) => element.getText() === '<RedwoodApolloProvider>')

      if (!redwoodApolloProvider) {
        console.warn(
          colors.warning(`Unable to find <RedwoodApolloProvider> in ${appPath}`)
        )

        return
      }

      // Find the graphQLClientConfig prop
      const graphQLClientConfigProp = redwoodApolloProvider
        .getChildSyntaxList()
        ?.getChildrenOfKind(SyntaxKind.JsxAttribute)
        .find((attr) => attr.getName() === 'graphQLClientConfig')

      if (!graphQLClientConfigProp) {
        console.warn(
          colors.warning(
            `Unable to find the graphQLClientConfig prop on <RedwoodApolloProvider> in ${appPath}`
          )
        )

        return
      }

      // Find the cacheConfig prop
      const cacheConfig = graphQLClientConfigProp
        .getChildSyntaxList()
        ?.getChildrenOfKind(SyntaxKind.JsxAttribute)
        .find((attr) => attr.getName() === 'cacheConfig')

      // Add possibleTypes to cacheConfig
      const possibleTypesExpression = `possibleTypes,`

      if (cacheConfig) {
        cacheConfig.replaceWithText((writer) => {
          writer.write('cacheConfig: {')
          writer.indent(() => {
            writer.write('fragments: [],')
            writer.write(possibleTypesExpression)
          })
          writer.write('},')
        })
      }

      // Save the changes
      project.save()

      if (appSourceFileChanged) {
        await project.save()
        const updatedHandler = fs.readFileSync(appPath, 'utf-8')
        const prettifiedHandler = format(updatedHandler, {
          ...prettierOptions(),
          parser: 'babel-ts',
        })
        fs.writeFileSync(appPath, prettifiedHandler, 'utf-8')
      }
    },
  }
}

export async function handler({ force }: Args) {
  recordTelemetryAttributes({
    command: 'setup graphql fragments',
    force,
  })

  const tasks = new Listr(
    [
      {
        title:
          'Update Redwood Project Configuration to enable GraphQL Fragments...',
        skip: () => {
          const redwoodTomlPath = getConfigPath()

          if (force) {
            // Never skip when --force is used
            return false
          }

          const redwoodTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
          if (/\bfragments\s*=\s*true/.test(redwoodTomlContent)) {
            return 'GraphQL Fragments are already enabled.'
          }

          return false
        },
        task: () => {
          const redwoodTomlPath = getConfigPath()
          const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

          const tomlToAppend = `[graphql]\n  fragments = true`

          const newConfig = originalTomlContent + '\n' + tomlToAppend

          fs.writeFileSync(redwoodTomlPath, newConfig, 'utf-8')
        },
      },
      {
        title: 'Generate possibleTypes.ts...',
        task: () => {
          execa.commandSync('yarn redwood generate types', { stdio: 'ignore' })
        },
      },
      {
        title: 'Import possibleTypes in App.tsx...',
        task: () => {
          return addPossibleTypesImportToApp()
        },
      },
      {
        title: 'Add possibleTypes to the GraphQL cache config',
        task: () => {
          return updateGraphQlCacheConfig()
        },
      },
    ],
    { rendererOptions: { collapseSubtasks: false } }
  )

  try {
    await tasks.run()
  } catch (e: any) {
    console.error(colors.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
