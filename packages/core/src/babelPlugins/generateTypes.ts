import path from 'path'

import { DefaultHost } from '@redwoodjs/structure'

/**
 * Searches `node_modules/@types/@redwoodjs/generated` for files ending with `.d.ts`
 * and references them in `node_modules/@types/@redwoodjs/index.d.ts`
 */
export const generateTypeDefIndex = () => {
  const host = new DefaultHost()

  const indexDefFile = []
  indexDefFile.push(`// ${new Date().toISOString()}`)
  for (const typeDefFile of host
    .readdirSync(host.paths.types)
    .filter((name) => name.endsWith('.d.ts'))) {
    indexDefFile.push(`/// <reference path="./types/${typeDefFile}" />`)
  }

  host.writeFileSync(
    path.resolve(host.paths.types, '../index.d.ts'),
    indexDefFile.join('\n')
  )
}

/**
 * Generate a type definition
 */
export const generateTypeDef = (filename: string, contents: string) => {
  const host = new DefaultHost()
  host.writeFileSync(path.join(host.paths.types, filename), contents)
}
