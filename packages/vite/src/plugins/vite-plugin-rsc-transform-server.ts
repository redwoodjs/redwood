import type { AssignmentProperty, Expression, Pattern, Program } from 'acorn'
import { parse } from 'acorn-loose'
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

      let body: Program['body']

      try {
        body = parse(code, {
          ecmaVersion: 2024,
          sourceType: 'module',
        }).body
      } catch (e: any) {
        console.error('Error parsing', id, e.message)
        return code
      }

      let useClient = false
      let useServer = false

      for (const node of body) {
        if (node.type !== 'ExpressionStatement' || !node.directive) {
          continue
        }

        if (node.directive === 'use client') {
          useClient = true
        }

        if (node.directive === 'use server') {
          useServer = true
        }
      }

      if (useClient && useServer) {
        throw new Error(
          'Cannot have both "use client" and "use server" directives in the same file.',
        )
      }

      let transformedCode = code

      if (useServer) {
        transformedCode = transformServerModule(body, id, code)
      }

      return transformedCode
    },
  }
}

function addLocalExportedNames(
  names: Map<string, string>,
  node: Pattern | AssignmentProperty | Expression,
) {
  switch (node.type) {
    case 'Identifier':
      names.set(node.name, node.name)
      return

    case 'ObjectPattern':
      for (let i = 0; i < node.properties.length; i++) {
        addLocalExportedNames(names, node.properties[i])
      }

      return

    case 'ArrayPattern':
      for (let i = 0; i < node.elements.length; i++) {
        const element = node.elements[i]
        if (element) {
          addLocalExportedNames(names, element)
        }
      }

      return

    case 'Property':
      addLocalExportedNames(names, node.value)
      return

    case 'AssignmentPattern':
      addLocalExportedNames(names, node.left)
      return

    case 'RestElement':
      addLocalExportedNames(names, node.argument)
      return

    case 'ParenthesizedExpression':
      addLocalExportedNames(names, node.expression)
      return

    default:
      throw new Error(`Unsupported node type: ${node.type}`)
  }
}

function transformServerModule(
  body: Program['body'],
  url: string,
  code: string,
): string {
  // If the same local name is exported more than once, we only need one of the names.
  const localNames = new Map<string, string>()
  const localTypes = new Map<string, string>()

  for (const node of body) {
    switch (node.type) {
      case 'ExportAllDeclaration':
        // If export * is used, the other file needs to explicitly opt into "use server" too.
        break

      case 'ExportDefaultDeclaration':
        if (node.declaration.type === 'Identifier') {
          localNames.set(node.declaration.name, 'default')
        } else if (node.declaration.type === 'FunctionDeclaration') {
          if (node.declaration.id) {
            localNames.set(node.declaration.id.name, 'default')
            localTypes.set(node.declaration.id.name, 'function')
          }
        }

        break

      case 'ExportNamedDeclaration':
        if (node.declaration) {
          if (node.declaration.type === 'VariableDeclaration') {
            const declarations = node.declaration.declarations

            for (let j = 0; j < declarations.length; j++) {
              addLocalExportedNames(localNames, declarations[j].id)
            }
          } else {
            const name = node.declaration.id.name
            localNames.set(name, name)

            if (node.declaration.type === 'FunctionDeclaration') {
              localTypes.set(name, 'function')
            }
          }
        }

        if (node.specifiers) {
          const specifiers = node.specifiers

          for (let j = 0; j < specifiers.length; j++) {
            const specifier = specifiers[j]
            if (
              specifier.local.type === 'Identifier' &&
              specifier.exported.type === 'Identifier'
            ) {
              localNames.set(specifier.local.name, specifier.exported.name)
            } else {
              throw new Error('Unsupported export specifier')
            }
          }
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
