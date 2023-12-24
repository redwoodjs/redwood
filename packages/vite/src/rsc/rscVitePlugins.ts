import path from 'node:path'

import * as swc from '@swc/core'
import type { Plugin } from 'vite'

import * as RSDWNodeLoader from '../react-server-dom-webpack/node-loader'
import type { ResolveFunction } from '../react-server-dom-webpack/node-loader'

// Used in Step 2 of the build process, for the client bundle
export function rscIndexPlugin(): Plugin {
  const codeToInject = `
    globalThis.__rw_module_cache__ = new Map();

    globalThis.__webpack_chunk_load__ = (id) => {
      return import(id).then((m) => globalThis.__rw_module_cache__.set(id, m))
    };

    globalThis.__webpack_require__ = (id) => {
      return globalThis.__rw_module_cache__.get(id)
    };\n  `

  return {
    name: 'rsc-index-plugin',
    async transformIndexHtml() {
      return [
        {
          tag: 'script',
          children: codeToInject,
          injectTo: 'body',
        },
      ]
    },
  }
}

export function rscTransformPlugin(): Plugin {
  return {
    name: 'rsc-transform-plugin',
    async resolveId(id, importer, options) {
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

      const load = async (url: string) => {
        let source = url === id ? code : (await this.load({ id: url })).code

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

      RSDWNodeLoader.resolve(
        '',
        { conditions: ['react-server'], parentURL: '' },
        resolve
      )

      const source = (await RSDWNodeLoader.load(id, null, load)).source

      return source
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
