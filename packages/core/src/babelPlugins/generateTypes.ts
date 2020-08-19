import path from 'path'

import { Paths, getPaths } from '@redwoodjs/internal'
import { Host, DefaultHost } from '@redwoodjs/structure'

interface HostWithPath {
  host: Host
  genTypesPath: string
}

/**
 * Babel plugins place type definitions in `node_modules/@types/@redwoodjs/generated`.
 * This function traverses that directory and includes references to them
 * in `node_modules/@types/@redwoodjs/index.d.ts`
 */
export const generateTypeDefIndex = (
  { host, paths }: HostWithPath = {
    host: new DefaultHost(),
    genTypesPath: getPaths().types,
  }
) => {
  const genTypesPath = paths.types

  const indexDefFile = []
  for (const typeDefFile of host.readdirSync(genTypesPath)) {
    indexDefFile.push(`/// <reference path="./generated/${typeDefFile}" />`)
  }

  // @ts-expect-error
  host.writeFileSync(
    path.resolve(genTypesPath, '../index.d.ts'),
    indexDefFile.join('\n')
  )
}

/**
 * Generate a type definition
 */
export const generateTypeDef = (
  filename: string,
  contents: string,
  { host, genTypesPath }: HostWithPath = {
    host: new DefaultHost(),
    genTypesPath: getPaths().types,
  }
) => {
  // @ts-expect-error
  host.writeFileSync(path.join(genTypesPath, filename), contents)
}
