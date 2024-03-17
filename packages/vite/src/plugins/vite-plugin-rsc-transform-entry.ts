import { normalizePath, type Plugin } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { rscWebpackShims } from '../lib/rscWebpackShims.js'

export function rscTransformEntryPlugin(): Plugin {
  const entryServerPath = normalizePath(getPaths().web.entryServer || '')
  const entryClientPath = normalizePath(getPaths().web.entryClient || '')

  return {
    name: 'rsc-transform-entry',
    banner: (chunk) => {
      if (
        chunk.facadeModuleId === entryServerPath ||
        chunk.facadeModuleId === entryClientPath
      ) {
        return rscWebpackShims
      }
      return ''
    },
  }
}
