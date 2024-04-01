import path from 'node:path'

import * as acorn from 'acorn-loose'
import type { Plugin } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

export function rscTransformUseClientPlugin(
  clientEntryFiles: Record<string, string>,
): Plugin {
  return {
    name: 'rsc-transform-use-client-plugin',
    transform: async function (code, id) {
      // Do a quick check for the exact string. If it doesn't exist, don't
      // bother parsing.
      if (!code.includes('use client')) {
        return code
      }

      // TODO (RSC): Bad bad hack. Don't do this.
      // At least look for something that's guaranteed to be only present in
      // transformed modules
      // Ideally don't even try to transform twice
      if (code.includes('$$id')) {
        // Already transformed
        return code
      }

      let body

      try {
        body = acorn.parse(code, {
          ecmaVersion: 2024,
          sourceType: 'module',
        }).body
      } catch (x: any) {
        console.error('Error parsing %s %s', id, x.message)
        return code
      }

      let useClient = false
      let useServer = false

      for (let i = 0; i < body.length; i++) {
        const node = body[i]

        if (node.type !== 'ExpressionStatement' || !node.directive) {
          break
        }

        if (node.directive === 'use client') {
          useClient = true
        }

        if (node.directive === 'use server') {
          useServer = true
        }
      }

      if (!useClient) {
        return code
      }

      if (useClient && useServer) {
        throw new Error(
          'Cannot have both "use client" and "use server" directives in the same file.',
        )
      }

      const transformedCode = await transformClientModule(
        code,
        body,
        id,
        clientEntryFiles,
      )

      return transformedCode
    },
  }
}

function addExportNames(names: Array<string>, node: any) {
  switch (node.type) {
    case 'Identifier':
      names.push(node.name)
      return

    case 'ObjectPattern':
      for (let i = 0; i < node.properties.length; i++) {
        addExportNames(names, node.properties[i])
      }

      return

    case 'ArrayPattern':
      for (let i = 0; i < node.elements.length; i++) {
        const element = node.elements[i]
        if (element) {
          addExportNames(names, element)
        }
      }

      return

    case 'Property':
      addExportNames(names, node.value)
      return

    case 'AssignmentPattern':
      addExportNames(names, node.left)
      return

    case 'RestElement':
      addExportNames(names, node.argument)
      return

    case 'ParenthesizedExpression':
      addExportNames(names, node.expression)
      return
  }
}

/**
 * Parses `body` for exports and stores them in `names` (the second argument)
 */
async function parseExportNamesIntoNames(
  code: string,
  body: any,
  names: Array<string>,
): Promise<void> {
  for (let i = 0; i < body.length; i++) {
    const node = body[i]

    switch (node.type) {
      case 'ExportAllDeclaration':
        if (node.exported) {
          addExportNames(names, node.exported)
          continue
        } else {
          let childBody

          try {
            childBody = acorn.parse(code, {
              ecmaVersion: 2024,
              sourceType: 'module',
            }).body
          } catch (x: any) {
            console.error('Error parsing %s %s', '', x.message)
            continue
          }

          await parseExportNamesIntoNames(code, childBody, names)

          continue
        }

      case 'ExportDefaultDeclaration':
        names.push('default')
        continue

      case 'ExportNamedDeclaration':
        if (node.declaration) {
          if (node.declaration.type === 'VariableDeclaration') {
            const declarations = node.declaration.declarations

            for (let j = 0; j < declarations.length; j++) {
              addExportNames(names, declarations[j].id)
            }
          } else {
            addExportNames(names, node.declaration.id)
          }
        }

        if (node.specifiers) {
          const specifiers = node.specifiers

          for (let j = 0; j < specifiers.length; j++) {
            addExportNames(names, specifiers[j].exported)
          }
        }

        continue
    }
  }
}

async function transformClientModule(
  code: string,
  body: any,
  url: string,
  clientEntryFiles: Record<string, string>,
): Promise<string> {
  const names: Array<string> = []

  // This will insert the names into the `names` array
  await parseExportNamesIntoNames(code, body, names)
  console.log('transformClientModule names', names)

  // entryRecord will be undefined for dev, because clientEntryFiles will just
  // be an empty object. See rscWorker.ts, where we do rscTransformPlugin({})
  const entryRecord = Object.entries(clientEntryFiles).find(
    ([_key, value]) => value === url,
  )

  const loadId = entryRecord
    ? path.join(getPaths().web.distRsc, 'assets', `${entryRecord[0]}.mjs`)
    : url

  let newSrc =
    "const CLIENT_REFERENCE = Symbol.for('react.client.reference');\n"

  for (let i = 0; i < names.length; i++) {
    const name = names[i]

    if (name === 'default') {
      newSrc += 'export default '
      newSrc += 'Object.defineProperties(function() {'
      newSrc +=
        'throw new Error(' +
        JSON.stringify(
          'Attempted to call the default export of ' +
            url +
            " from the server but it's on the client. It's not possible to " +
            'invoke a client function from the server, it can only be ' +
            'rendered as a Component or passed to props of a Client Component.',
        ) +
        ');'
    } else {
      newSrc += 'export const ' + name + ' = '
      newSrc += 'Object.defineProperties(function() {'
      newSrc +=
        'throw new Error(' +
        JSON.stringify(
          'Attempted to call ' +
            name +
            '() from the server but ' +
            name +
            ' is on the client. ' +
            "It's not possible to invoke a client function from the server, it can " +
            'only be rendered as a Component or passed to props of a Client Component.',
        ) +
        ');'
    }

    newSrc += '},{'
    newSrc += '$$typeof: {value: CLIENT_REFERENCE},'
    newSrc += '$$id: {value: ' + JSON.stringify(loadId + '#' + name) + '}'
    newSrc += '});\n'
  }

  return newSrc
}
