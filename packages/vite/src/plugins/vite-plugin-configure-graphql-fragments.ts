import fs from 'fs'
import path from 'path'

import type { PluginOption } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

/**
 *
 * This is a vite plugin to import possible types from the generated file.
 *
 * Only applies on build, not on dev.
 *
 */
export default function configureGraphQLFragments(): PluginOption {
  const possibleTypes = path.join(getPaths().web.graphql, 'possibleTypes.ts')

  return {
    name: 'configure-graphql-fragments',
    apply: 'build', // <-- @MARK important
    load: (id) => {
      if (/@redwoodjs\/web\/dist\/apollo\/possibleTypes/.test(id)) {
        if (fs.existsSync(possibleTypes)) {
          const possibleTypeFile = fs.readFileSync(possibleTypes, 'utf8')

          const startOfResult = possibleTypeFile.indexOf(
            'result: PossibleTypesResultData'
          )
          const firstOpenBrace = possibleTypeFile.indexOf('{', startOfResult)
          const lastCloseBrace = possibleTypeFile.lastIndexOf('}')

          const content = possibleTypeFile.slice(firstOpenBrace, lastCloseBrace)

          const result = `const result = ${content}
          };

          module.exports = result;
          `

          return result
        }
        return null
      }

      return null
    },
  }
}
