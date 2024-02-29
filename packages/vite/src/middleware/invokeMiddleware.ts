import { defaultAuthProviderState, type ServerAuthState } from '@redwoodjs/auth'
import type { RWRouteManifestItem } from '@redwoodjs/internal/dist/routes'

import { MiddlewareRequest } from './MiddlewareRequest'
import { MiddlewareResponse } from './MiddlewareResponse'

type Middleware = (
  req: MiddlewareRequest,
  res?: MiddlewareResponse,
  route?: any
) => Promise<MiddlewareResponse> | Response | void

/**
 *
 * Invokes the middleware function, and guarantees and MWResponse object is returned
 * (also making sure that the eventual Response will be of PonyResponse)
 *
 * Returns Tuple<MiddlewareResponse, ServerAuthState>
 *
 */
export const invoke = async (
  req: Request,
  middleware?: Middleware,
  options?: { route?: RWRouteManifestItem }
): Promise<[MiddlewareResponse, ServerAuthState]> => {
  if (typeof middleware !== 'function') {
    return [MiddlewareResponse.next(), defaultAuthProviderState]
  }

  const mwReq = new MiddlewareRequest(req)
  let mwRes: MiddlewareResponse = MiddlewareResponse.next()

  try {
    const output =
      (await middleware(mwReq, MiddlewareResponse.next(), options)) ||
      MiddlewareResponse.next()

    if (output instanceof MiddlewareResponse) {
      mwRes = output
    } else if (typeof output === 'object' && output instanceof Response) {
      // If it was a WebAPI Response
      mwRes = MiddlewareResponse.fromResponse(output)
    } else {
      throw new Error(
        'Middleware must return a MiddlewareResponse or a Response'
      )
    }
  } catch (e) {
    console.error('Error executing middleware > \n')
    console.error('~'.repeat(80))
    console.error(e)
    console.error('~'.repeat(80))
  }

  return [mwRes, mwReq.serverAuthContext.get()]
}
