import { pathToFileURL } from 'node:url'

import type { Request as ExpressRequest } from 'express'
import type { ViteDevServer } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

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

export const getFullUrl = (req: ExpressRequest, rscEnabled: boolean) => {
  // For a standard request:
  //
  // req.originalUrl /about
  // req.protocol http
  // req.headers.host localhost:8910
  // req.get('host') localhost:8910
  // baseUrl http://localhost:8910
  // url.href http://localhost:8910/about
  // props {}
  //
  // For an RSC request:
  //
  // req.originalUrl /rw-rsc/__rwjs__Routes?props=%7B%22location%22%3A%7B%22pathname%22%3A%22%2Fabout%22%2C%22search%22%3A%22%22%7D%7D
  // req.protocol http
  // req.headers.host localhost:8910
  // req.get('host') localhost:8910
  // baseUrl http://localhost:8910
  // url.href http://localhost:8910/rw-rsc/__rwjs__Routes?props=%7B%22location%22%3A%7B%22pathname%22%3A%22%2Fabout%22%2C%22search%22%3A%22%22%7D%7D
  // props { location: { pathname: '/about', search: '' } }

  console.log('getFullUrl req.originalUrl', req.originalUrl)
  console.log('getFullUrl req.protocol', req.protocol)
  console.log('getFullUrl req.headers.host', req.headers.host)
  console.log("getFullUrl req.get('host')", req.get('host'))

  const baseUrl = req.protocol + '://' + req.headers.host

  console.log('getFullUrl baseUrl', baseUrl)

  // Properly parsing search params is difficult, so let's construct a URL
  // object and have it do the parsing for us.
  const url = new URL(req.originalUrl || '', baseUrl)

  // `props` will be something like:
  // "__rwjs__pathname=/about&__rwjs__search=
  const props = url.searchParams.get('props') || ''

  console.log('getFullUrl url.href', url.href)
  console.log('getFullUrl props', props)

  let pathnamePlusSearch = req.originalUrl

  if (
    rscEnabled &&
    props.includes('__rwjs__pathname') &&
    props.includes('__rwjs__search')
  ) {
    const matches = props.match(
      /^__rwjs__pathname=(.*?)&__rwjs__search=(.*?)(?:::)?/,
    )
    const pathname = matches?.[1]
    const search = matches?.[2]

    if (pathname && (search === '' || search)) {
      pathnamePlusSearch = pathname + search
    }
  }

  return baseUrl + pathnamePlusSearch
}
