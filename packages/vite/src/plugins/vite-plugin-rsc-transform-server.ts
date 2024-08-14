import * as swc from '@swc/core'
import type { Plugin } from 'vite'

export function rscTransformUseServerPlugin(): Plugin {
  return {
    name: 'rsc-transform-use-server-plugin',
    transform: async function (code, id) {
      // Do a quick check for the exact string. If it doesn't exist, don't
      // bother parsing. This check doesn't have to be perfect. It's just a
      // quick check to avoid doing a full parse to build an AST.
      // Plesae benchmark before making any changes here.
      // See https://github.com/redwoodjs/redwood/pull/11158
      if (!code.includes('use server')) {
        return code
      }

      let mod: swc.Module

      const isTypescript = id.endsWith('.ts') || id.endsWith('.tsx')

      try {
        mod = swc.parseSync(code, {
          target: 'es2022',
          syntax: isTypescript ? 'typescript' : 'ecmascript',
        })
      } catch (e: any) {
        console.error('Error parsing', id, e.message)
        return code
      }

      let useClient = false
      let moduleScopedUseServer = false

      for (const node of mod.body) {
        if (
          node.type !== 'ExpressionStatement' ||
          node.expression.type !== 'StringLiteral'
        ) {
          continue
        }

        if (node.expression.value === 'use client') {
          useClient = true
        }

        if (node.expression.value === 'use server') {
          moduleScopedUseServer = true
        }
      }

      // TODO (RSC): Should also throw if there are function scoped "use server"
      // directives in the file
      if (useClient && moduleScopedUseServer) {
        throw new Error(
          'Cannot have both "use client" and "use server" directives in the same file.',
        )
      }

      let transformedCode = code

      if (moduleScopedUseServer) {
        transformedCode = transformServerModule(mod, id, code)
      } else {
        transformedCode = transformServerFunction(mod, id, code)
      }

      return transformedCode
    },
  }
}

function transformServerModule(
  mod: swc.Module,
  url: string,
  code: string,
): string {
  // If the same local name is exported more than once, we only need one of the names.
  const localNames = new Map<string, string>()
  const localTypes = new Map<string, string>()

  for (const node of mod.body) {
    switch (node.type) {
      // TODO (RSC): Add code comments with examples of each type of node

      case 'ExportDeclaration':
        if (node.declaration.type === 'FunctionDeclaration') {
          const name = node.declaration.identifier.value
          localNames.set(name, name)
          localTypes.set(name, 'function')
        } else if (node.declaration.type === 'VariableDeclaration') {
          for (const declaration of node.declaration.declarations) {
            if (declaration.id.type === 'Identifier') {
              const name = declaration.id.value
              localNames.set(name, name)
            }
          }
        }

        break

      case 'ExportDefaultDeclaration':
        if (node.decl.type === 'FunctionExpression') {
          const identifier = node.decl.identifier
          if (identifier) {
            localNames.set(identifier.value, 'default')
            localTypes.set(identifier.value, 'function')
          }
        }

        break

      case 'ExportNamedDeclaration':
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ExportSpecifier') {
            const name = specifier.orig.value

            if (specifier.exported?.type === 'Identifier') {
              const exportedName = specifier.exported.value
              localNames.set(name, exportedName)
            } else if (specifier.orig.type === 'Identifier') {
              localNames.set(name, name)
            }
          }
        }

        break

      case 'ExportDefaultExpression':
        if (node.expression.type === 'Identifier') {
          localNames.set(node.expression.value, 'default')
        }

        break
    }
  }

  let newSrc =
    code +
    '\n\n' +
    'import {registerServerReference} from ' +
    '"react-server-dom-webpack/server";\n'

  localNames.forEach(function (exported, local) {
    if (localTypes.get(local) !== 'function') {
      // We first check if the export is a function and if so annotate it.
      newSrc += 'if (typeof ' + local + ' === "function") '
    }

    const urlStr = JSON.stringify(url)
    const exportedStr = JSON.stringify(exported)
    newSrc += `registerServerReference(${local},${urlStr},${exportedStr});\n`
  })

  return newSrc
}

function transformServerFunction(
  mod: swc.Module,
  url: string,
  code: string,
): string {
  // If the same local name is exported more than once, we only need one of the names.
  const localNames = new Map<string, string>()
  const localTypes = new Map<string, string>()
  const serverActions = new Set<string>()
  const localExports = new Map<string, string>()

  for (const node of mod.body) {
    switch (node.type) {
      // TODO (RSC): Add code comments with examples of each type of node

      // export async function formAction(formData: FormData) { /* ... */ }
      // export const formAction = async (formData: FormData) => { /* ... */ }
      case 'ExportDeclaration':
        if (
          node.declaration.type === 'FunctionDeclaration' &&
          node.declaration.body
        ) {
          const name = node.declaration.identifier.value

          // Check if the body contains a "use server" directive as the first
          // statement.
          const firstStmt = node.declaration.body.stmts[0]
          if (
            firstStmt &&
            firstStmt.type === 'ExpressionStatement' &&
            firstStmt.expression.type === 'StringLiteral' &&
            firstStmt.expression.value === 'use server'
          ) {
            localNames.set(name, name)
            localTypes.set(name, 'function')
          }
        } else if (node.declaration.type === 'VariableDeclaration') {
          for (const declaration of node.declaration.declarations) {
            if (
              declaration.id.type === 'Identifier' &&
              declaration.init?.type === 'ArrowFunctionExpression' &&
              // The body has to be a block statement to have a "use server"
              // directive
              declaration.init.body.type === 'BlockStatement'
            ) {
              const firstStmt = declaration.init.body.stmts[0]

              if (
                firstStmt &&
                firstStmt.type === 'ExpressionStatement' &&
                firstStmt.expression.type === 'StringLiteral' &&
                firstStmt.expression.value === 'use server'
              ) {
                const name = declaration.id.value
                localNames.set(name, name)
              }
            }
          }
        }

        break

      case 'ExportDefaultDeclaration':
        if (
          node.decl.type === 'FunctionExpression' &&
          // The body has to be a block statement to have a "use server"
          // directive
          node.decl.body?.type === 'BlockStatement'
        ) {
          const firstStmt = node.decl.body.stmts[0]

          if (
            firstStmt &&
            firstStmt.type === 'ExpressionStatement' &&
            firstStmt.expression.type === 'StringLiteral' &&
            firstStmt.expression.value === 'use server'
          ) {
            const identifier = node.decl.identifier
            if (identifier) {
              localNames.set(identifier.value, 'default')
              localTypes.set(identifier.value, 'function')
            }
          }
        }

        break

      // export { formAction, arrowAction }
      case 'ExportNamedDeclaration':
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ExportSpecifier') {
            const name = specifier.orig.value

            if (specifier.exported?.type === 'Identifier') {
              const exportedName = specifier.exported.value
              localExports.set(name, exportedName)
            } else if (specifier.orig.type === 'Identifier') {
              localExports.set(name, name)
            }
          }
        }

        break

      case 'ExportDefaultExpression':
        if (node.expression.type === 'Identifier') {
          localNames.set(node.expression.value, 'default')
        }

        break

      case 'FunctionDeclaration': {
        const name = node.identifier.value

        if (node.body?.type === 'BlockStatement') {
          const firstStmt = node.body.stmts[0]

          if (
            firstStmt &&
            firstStmt.type === 'ExpressionStatement' &&
            firstStmt.expression.type === 'StringLiteral' &&
            firstStmt.expression.value === 'use server'
          ) {
            serverActions.add(name)
          }
        }

        break
      }

      case 'VariableDeclaration':
        for (const declaration of node.declarations) {
          if (
            declaration.id.type === 'Identifier' &&
            declaration.init?.type === 'ArrowFunctionExpression' &&
            // The body has to be a block statement to have a "use server"
            // directive
            declaration.init.body.type === 'BlockStatement'
          ) {
            const firstStmt = declaration.init.body.stmts[0]

            if (
              firstStmt &&
              firstStmt.type === 'ExpressionStatement' &&
              firstStmt.expression.type === 'StringLiteral' &&
              firstStmt.expression.value === 'use server'
            ) {
              serverActions.add(declaration.id.value)
            }
          }
        }
    }
  }

  for (const [localName, exportName] of localExports) {
    if (serverActions.has(localName)) {
      localNames.set(localName, exportName)
      localTypes.set(localName, 'function')
    }
  }

  // No functions with "use server" directive found
  if (localNames.size === 0) {
    return code
  }

  let newSrc =
    code +
    '\n\n' +
    'import {registerServerReference} from ' +
    '"react-server-dom-webpack/server";\n'

  localNames.forEach(function (exported, local) {
    if (localTypes.get(local) !== 'function') {
      // We first check if the export is a function and if so annotate it.
      newSrc += 'if (typeof ' + local + ' === "function") '
    }

    const urlStr = JSON.stringify(url)
    const exportedStr = JSON.stringify(exported)
    newSrc += `registerServerReference(${local},${urlStr},${exportedStr});\n`
  })

  return newSrc
}
