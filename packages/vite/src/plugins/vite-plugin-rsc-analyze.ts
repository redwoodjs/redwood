import path from 'node:path'

import * as swc from '@swc/core'
import type { Plugin } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

export function rscAnalyzePlugin(
  clientEntryCallback: (id: string) => void,
  serverEntryCallback: (id: string) => void,
  clientEntryCssCallback: (id: string, cssId: string) => void,
  componentImportsCallback: (id: string, importId: readonly string[]) => void,
): Plugin {
  const clientEntryIdSet = new Set<string>()
  const webSrcPath = getPaths().web.src

  return {
    name: 'rsc-analyze-plugin',
    transform(code, id) {
      const ext = path.extname(id)

      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        const mod = swc.parseSync(code, {
          syntax: ext === '.ts' || ext === '.tsx' ? 'typescript' : 'ecmascript',
          tsx: ext === '.tsx',
        })

        for (const item of mod.body) {
          if (
            item.type === 'ExpressionStatement' &&
            item.expression.type === 'StringLiteral'
          ) {
            if (item.expression.value === 'use client') {
              clientEntryCallback(id)
              clientEntryIdSet.add(id)
            } else if (item.expression.value === 'use server') {
              serverEntryCallback(id)
            }
          }
        }
      }

      return code
    },
    moduleParsed(moduleInfo) {
      const moduleId = moduleInfo.id
      // TODO: Maybe this is not needed but added it for now to keep my life sane
      if (!moduleId.startsWith(webSrcPath)) {
        return
      }
      if (moduleId.endsWith('.css')) {
        return
      }
      if (clientEntryIdSet.has(moduleId)) {
        const cssImports = moduleInfo.importedIds.filter((id) =>
          id.endsWith('.css'),
        )
        for (const cssImport of cssImports) {
          clientEntryCssCallback(moduleId, cssImport)
        }
      }
      componentImportsCallback(moduleId, moduleInfo.importedIds)
    },
  }
}
