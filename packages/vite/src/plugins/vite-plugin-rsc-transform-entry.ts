import { normalizePath, type Plugin } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

export function rscTransformEntryPlugin(): Plugin {
  const entryServerPath = normalizePath(getPaths().web.entryServer || '')
  const entryClientPath = normalizePath(getPaths().web.entryClient || '')

  const rscWebpackShims = `
globalThis.__rw_module_cache__ ||= new Map();

globalThis.__webpack_chunk_load__ ||= (id) => {
  console.log('rscWebpackShims chunk load id', id)
  return import(id).then((m) => globalThis.__rw_module_cache__.set(id, m))
};

globalThis.__webpack_require__ ||= (id) => {
  console.log('rscWebpackShims require id', id)
  return globalThis.__rw_module_cache__.get(id)
};\n`

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
