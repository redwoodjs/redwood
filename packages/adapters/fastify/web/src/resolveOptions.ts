import { getConfig } from '@redwoodjs/project-config'

import type { RedwoodFastifyWebOptions } from './types'

export function resolveOptions(options: RedwoodFastifyWebOptions) {
  const redwood = options.redwood ?? {}

  redwood.apiUrl ??= getConfig().web.apiUrl
  const apiUrlIsFullyQualifiedUrl = isFullyQualifiedUrl(redwood.apiUrl)

  // `apiHost` is deprecated. If it's set and `apiProxyTarget` isn't, we'll use it as `apiProxyTarget`.
  if (redwood.apiHost && !redwood.apiProxyTarget) {
    redwood.apiProxyTarget = redwood.apiHost
    delete redwood.apiHost
  }

  if (redwood.apiProxyTarget && !isFullyQualifiedUrl(redwood.apiProxyTarget)) {
    throw new Error(
      `If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '${redwood.apiProxyTarget}'`
    )
  }

  // If users don't supply `apiUrl` but do supply `apiProxyTarget`, error.
  // We don't have a prefix to use as the starting point of a proxy.
  //
  // ```js
  // {
  //   apiUrl: undefined,
  //   apiProxyTarget: 'http://api.bar.com'
  // }
  // ```
  //
  // This is pretty unlikely because we default `apiUrl` to '/.redwood/functions'
  if (!redwood.apiUrl && redwood.apiProxyTarget) {
    throw new Error(
      `If you provide \`apiProxyTarget\`, \`apiUrl\` has to be a relative URL. \`apiUrl\` is '${redwood.apiUrl}'`
    )
  }

  // If users supply a fully-qualified `apiUrl` and `apiProxyTarget`, error.
  // We don't have a prefix to use as the starting point of a proxy.
  //
  // ```js
  // {
  //   apiUrl: 'http://api.foo.com', // This isn't a prefix we can forward requests from
  //   apiProxyTarget: 'http://api.bar.com'
  // }
  // ```
  if (apiUrlIsFullyQualifiedUrl && redwood.apiProxyTarget) {
    throw new Error(
      `If you provide \`apiProxyTarget\`, \`apiUrl\` cannot be a fully-qualified URL. \`apiUrl\` is '${redwood.apiUrl}'`
    )
  }

  // If users supply a relative `apiUrl` but don't supply `apiProxyTarget`, error.
  // There's nowhere to proxy to.
  //
  // ```js
  // {
  //   apiUrl: '/api',
  //   apiProxyTarget: undefined // There's nowhere for requests to '/api' to go
  // }
  // ```
  // if (!apiUrlIsFullyQualifiedUrl && !redwood.apiProxyTarget) {
  //   throw new Error(
  //     `If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '${redwood.apiUrl}'`
  //   )
  // }

  return { redwood }
}

function isFullyQualifiedUrl(url: string) {
  try {
    // eslint-disable-next-line no-new
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}
