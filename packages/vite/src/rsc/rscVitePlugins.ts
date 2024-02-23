import path from 'node:path'

import * as swc from '@swc/core'
import type { Plugin } from 'vite'

import * as RSDWNodeLoader from '../react-server-dom-webpack/node-loader'
import type { ResolveFunction } from '../react-server-dom-webpack/node-loader'

export function rscTransformPlugin(
  clientEntryFiles: Record<string, string>
): Plugin {
  return {
    name: 'rsc-transform-plugin',
    // TODO(RSC): Seems like resolveId() is never called. Can we remove it?
    async resolveId(id, importer, options) {
      console.log(
        'rscVitePlugins - rscTransformPlugin::resolveId()',
        id,
        options
      )
      if (!id.endsWith('.js')) {
        return id
      }

      // FIXME This isn't necessary in production mode
      for (const ext of ['.js', '.ts', '.tsx', '.jsx']) {
        const resolved = await this.resolve(id.slice(0, -3) + ext, importer, {
          ...options,
          skipSelf: true,
        })

        if (resolved) {
          return resolved
        }
      }

      return undefined
    },
    async transform(code, id) {
      const resolve: ResolveFunction = async (
        specifier: string,
        { parentURL }: { parentURL: string | void; conditions: Array<string> }
      ) => {
        if (!specifier) {
          return { url: '' }
        }

        let resolved: Awaited<ReturnType<typeof this.resolve>> | undefined

        if (parentURL) {
          resolved = await this.resolve(specifier, parentURL, {
            skipSelf: true,
          })
        }

        if (!resolved) {
          throw new Error(`Failed to resolve ${specifier}`)
        }

        const url = resolved.id
        return { url }
      }

      const context = {
        conditions: ['react-server'],
        parentURL: '',
      }

      // Calling `resolve` here stashes the resolve function for use with
      // `RSDWNodeLoader.load()` below
      RSDWNodeLoader.resolve('', context, resolve)

      const load = async (url: string) => {
        let source: string | null = code

        if (url !== id) {
          source = (await this.load({ id: url })).code
        }

        if (!source) {
          throw new Error(`Failed to load ${url}`)
        }

        // HACK move directives before import statements.
        source = source.replace(
          /^(import {.*?} from ".*?";)\s*"use (client|server)";/,
          '"use $2";$1'
        )

        return { format: 'module', source }
      }

      const mod = await RSDWNodeLoader.load(id, null, load, clientEntryFiles)

      return mod.source
    },
  }
}

export function rscReloadPlugin(fn: (type: 'full-reload') => void): Plugin {
  let enabled = false
  const isClientEntry = (id: string, code: string) => {
    const ext = path.extname(id)
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      const mod = swc.parseSync(code, {
        syntax: ext === '.ts' || ext === '.tsx' ? 'typescript' : 'ecmascript',
        tsx: ext === '.tsx',
      })
      for (const item of mod.body) {
        if (
          item.type === 'ExpressionStatement' &&
          item.expression.type === 'StringLiteral' &&
          item.expression.value === 'use client'
        ) {
          return true
        }
      }
    }
    return false
  }

  return {
    name: 'reload-plugin',
    configResolved(config) {
      if (config.mode === 'development') {
        enabled = true
      }
    },
    async handleHotUpdate(ctx) {
      if (!enabled) {
        return []
      }

      if (ctx.modules.length && !isClientEntry(ctx.file, await ctx.read())) {
        return fn('full-reload')
      } else {
        return []
      }
    },
  }
}

export function rscAnalyzePlugin(
  clientEntryCallback: (id: string) => void,
  serverEntryCallback: (id: string) => void
): Plugin {
  return {
    name: 'rsc-analyze-plugin',
    transform(code, id) {
      const ext = path.extname(id)
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        // @MARK: We're using swc here, that's cool but another dependency!
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
            } else if (item.expression.value === 'use server') {
              serverEntryCallback(id)
            }
          }
        }
      }
      return code
    },
  }
}
