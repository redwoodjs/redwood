import path from 'path'

import { Paths, getPaths } from '@redwoodjs/internal'
import { Host, DefaultHost } from '@redwoodjs/structure'

/**
 * The babel plugins place type definitions in `node_modules/@types/@redwoodjs/generated`
 * This function traverses that directory and includes references to them
 * in `node_modules/@types/@redwoodjs/index.d.ts`
 */
export const generateTypeDefIndex = (
  { host, paths }: { host: Host; paths: Paths } = {
    host: new DefaultHost(),
    paths: getPaths(),
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
