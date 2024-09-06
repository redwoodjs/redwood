import { pathToFileURL } from 'node:url'

import type { Request as ExpressRequest } from 'express'
import type { ViteDevServer } from 'vite'

import { getPaths } from '@redwoodjs/project-config'
import type { RscFetchProps } from '@redwoodjs/router/RscRouter'

import type { EntryServer } from './types.js'

export function stripQueryStringAndHashFromPath(url: string) {
  return url.split('?')[0].split('#')[0]
}

// Check CWD: make sure its the web/ directory
// Without this Postcss can misbehave, and its hard to trace why.
export function ensureProcessDirWeb(webDir: string = getPaths().web.base) {
  if (process.cwd() !== webDir) {
    console.error('⚠️  Warning: CWD is ', process.cwd())
    console.warn('~'.repeat(50))
    console.warn(
      'The cwd must be web/. Please use `yarn rw <command>` or run the command from the web/ directory.',
    )
    console.log(`Changing cwd to ${webDir}....`)
    console.log()

    process.chdir(webDir)
  }
}

/**
 * Converts a file path to a URL path (file://...)
 * Without this, absolute paths can't be imported on Windows
 */
export function makeFilePath(path: string) {
  return pathToFileURL(path).href
}

export async function ssrLoadEntryServer(viteDevServer: ViteDevServer) {
  const rwPaths = getPaths()

  if (!rwPaths.web.entryServer) {
    throw new Error('entryServer not defined')
  }

  return viteDevServer.ssrLoadModule(
    rwPaths.web.entryServer,
    // Have to type cast here because ssrLoadModule just returns a generic
    // Record<string, any> type
  ) as Promise<EntryServer>
}

export function convertExpressHeaders(
  expressDistinctHeaders: ExpressRequest['headersDistinct'],
) {
  const headers = new Headers()
  for (const name in expressDistinctHeaders) {
    const values = expressDistinctHeaders[name]
    if (Array.isArray(values)) {
      // For multi-value headers, add each value separately
      for (const value of values) {
        headers.append(name, value)
      }
    }
  }

  return headers
}

export const getFullUrl = (req: ExpressRequest) => {
  // For a standard request:
  //
  // req.originalUrl /about
  // req.protocol http
  // req.headers.host localhost:8910
  // req.get('host') localhost:8910
  // baseUrl http://localhost:8910
  //
  // For an RSC request:
  //
  // req.originalUrl /rw-rsc/__rwjs__Routes?props=%7B%22location%22%3A%7B%22pathname%22%3A%22%2Fabout%22%2C%22search%22%3A%22%22%7D%7D
  // req.protocol http
  // req.headers.host localhost:8910
  // req.get('host') localhost:8910
  // baseUrl http://localhost:8910

  console.log('getFullUrl req.originalUrl', req.originalUrl)
  console.log('getFullUrl req.protocol', req.protocol)
  console.log('getFullUrl req.headers.host', req.headers.host)
  console.log("getFullUrl req.get('host')", req.get('host'))

  const baseUrl = req.protocol + '://' + req.headers.host

  console.log('getFullUrl baseUrl', baseUrl)

  return baseUrl + req.originalUrl
}

function isRscFetchProps(
  rscPropsMaybe: RscFetchProps | Record<string, unknown>,
): rscPropsMaybe is RscFetchProps {
  return (
    !!rscPropsMaybe.location &&
    typeof rscPropsMaybe.location === 'object' &&
    'pathname' in rscPropsMaybe.location
  )
}

export const getFullUrlForFlightRequest = (
  req: ExpressRequest,
  rscPropsMaybe: RscFetchProps | Record<string, unknown>,
): string => {
  if (isRscFetchProps(rscPropsMaybe)) {
    return (
      req.protocol +
      '://' +
      req.get('host') +
      rscPropsMaybe.location.pathname +
      rscPropsMaybe.location.search
    )
  } else {
    // If it's not an RscFetchProps, then the url can be returned as is (for
    // RSA requests)
    return getFullUrl(req)
  }
}
