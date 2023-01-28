import fs from 'fs'
import path from 'path'

import traverse from '@babel/traverse'
import {
  isCallExpression,
  isIdentifier,
  isTemplateElement,
  VariableDeclarator,
} from '@babel/types'
import { DirectiveDefinitionNode } from 'graphql'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import {
  getASTFromFile,
  getExportDefaultDeclaration,
  getSpecificNamedExportDeclarations,
} from '../lib/ast'
import { parseGraphQL } from '../lib/gql'

import {
  RedwoodError,
  RedwoodErrorCode,
  RedwoodWarning,
  RedwoodWarningCode,
} from './diagnostic'
import type { RedwoodProject } from './project'
import { RedwoodSkeleton } from './skeleton'

export class RedwoodDirective extends RedwoodSkeleton {
  readonly gql: string | undefined
  readonly kind: 'transform' | 'validate' | 'unknown' = 'unknown'

  constructor(filepath: string) {
    const warnings: RedwoodWarning[] = []
    const errors: RedwoodError[] = []
    let name: string | undefined
    let gql: string | undefined

    const ast = getASTFromFile(filepath)

    const requiredNamedExports = getSpecificNamedExportDeclarations(ast, [
      'schema',
    ])

    if (requiredNamedExports.has('schema')) {
      const schemaExportVariableDeclarator = requiredNamedExports.get(
        'schema'
      ) as VariableDeclarator
      switch (schemaExportVariableDeclarator.init?.type) {
        case 'TaggedTemplateExpression':
          if (
            schemaExportVariableDeclarator.init.quasi.quasis[0] !== undefined &&
            isTemplateElement(
              schemaExportVariableDeclarator.init.quasi.quasis[0]
            )
          ) {
            gql =
              schemaExportVariableDeclarator.init.quasi.quasis[0].value.cooked
          }
          break

        default:
          warnings.push({
            code: RedwoodWarningCode.GENERIC_PARSER_WARNING_JSTS,
            message: `Unable to extract the gql (${schemaExportVariableDeclarator.init?.type})`,
          })
          break
      }
      if (gql === undefined) {
        warnings.push({
          code: RedwoodWarningCode.GENERIC_PARSER_WARNING_JSTS,
          message: 'Could not extract the gql',
        })
      } else {
        const gqlAST = parseGraphQL(gql)
        const directiveDefinitions = gqlAST.definitions.filter(
          (node): node is DirectiveDefinitionNode => {
            return node.kind === 'DirectiveDefinition'
          }
        )
        if (directiveDefinitions.length !== 1) {
          errors.push({
            code: RedwoodErrorCode.DIRECTIVE_DEFINE_ONE_DIRECTIVE,
            message: 'Must define one directive',
          })
        } else {
          name = directiveDefinitions[0].name.value
        }
      }
    } else {
      errors.push({
        code: RedwoodErrorCode.DIRECTIVE_MISSING_SCHEMA_EXPORT,
        message: 'No "schema" export could be found',
      })
    }

    super(filepath, name)
    this.gql = gql
    this.errors = errors
    this.warnings = warnings

    const defaultExport = getExportDefaultDeclaration(ast)
    if (defaultExport !== undefined) {
      let directiveHelperFunctionName
      if (isIdentifier(defaultExport.declaration)) {
        const defaultExportVariable = defaultExport.declaration.name
        traverse(ast, {
          VariableDeclarator: (path) => {
            if (
              isIdentifier(path.node.id) &&
              path.node.id.name === defaultExportVariable &&
              isCallExpression(path.node.init) &&
              isIdentifier(path.node.init.callee)
            ) {
              directiveHelperFunctionName = path.node.init.callee.name
            }
          },
        })
      } else if (
        isCallExpression(defaultExport.declaration) &&
        isIdentifier(defaultExport.declaration.callee)
      ) {
        directiveHelperFunctionName = defaultExport.declaration.callee.name
      } else {
        this.warnings.push({
          code: RedwoodWarningCode.GENERIC_PARSER_WARNING_JSTS,
          message: 'The default export could not be understood',
        })
      }

      switch (directiveHelperFunctionName) {
        case 'createValidatorDirective':
          this.kind = 'validate'
          break
        case 'createTransformerDirective':
          this.kind = 'transform'
          break
        case undefined:
          this.warnings.push({
            code: RedwoodWarningCode.GENERIC_PARSER_WARNING_JSTS,
            message: `Could not understand the directive function`,
          })
          break
        default:
          this.warnings.push({
            code: RedwoodWarningCode.GENERIC_PARSER_WARNING_JSTS,
            message: `Could not understand the directive function "${directiveHelperFunctionName}"`,
          })
          break
      }
    } else {
      this.errors.push({
        code: RedwoodErrorCode.DIRECTIVE_MISSING_DEFAULT_EXPORT,
        message: 'Must have a default export which is the directive function',
      })
    }
  }
}

export function extractDirective(filepath: string) {
  return new RedwoodDirective(filepath)
}

export function extractDirectives(project?: RedwoodProject) {
  const directives: RedwoodDirective[] = []

  const directivesPath = project
    ? getPaths(project.filepath).api.directives
    : getPaths().api.directives

  if (!fs.existsSync(directivesPath)) {
    return directives
  }

  // TODO: Confirm this is the condition to detect a directive
  const getDirectiveFiles = (directory: string) => {
    const directiveFiles: string[] = []
    const directoryContents = fs.readdirSync(directory)
    directoryContents.forEach((content) => {
      const stat = fs.lstatSync(path.join(directory, content))
      if (stat.isDirectory()) {
        directiveFiles.push(...getDirectiveFiles(path.join(directory, content)))
      } else if (stat.isFile()) {
        if (
          content.match(/.+\.(js|ts)$/) &&
          !content.match(/.+\.(test\.js|test\.ts)$/)
        ) {
          directiveFiles.push(path.join(directory, content))
        }
      }
    })
    return directiveFiles
  }

  const directiveFiles = getDirectiveFiles(directivesPath)
  directiveFiles.forEach((directivePath) => {
    directives.push(extractDirective(directivePath))
  })

  return directives
}
