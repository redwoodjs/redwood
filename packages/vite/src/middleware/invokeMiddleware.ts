import {
  middlewareDefaultAuthProviderState,
  type ServerAuthState,
} from '@redwoodjs/auth'

import { setServerAuthState } from '../serverStore.js'

import { MiddlewareRequest } from './MiddlewareRequest.js'
import { MiddlewareResponse } from './MiddlewareResponse.js'
import type { Middleware, MiddlewareInvokeOptions } from './types.js'

/**
 * Invokes the middleware function, and guarantees a MiddlewareResponse object
 * is returned (also making sure that the eventual Response will be of
 * type PonyResponse)
 *
 * Returns promise that will resolve to a tuple of
 * [MiddlewareResponse, ServerAuthState]
 */
export const invoke = async (
  req: Request,
  middleware?: Middleware,
  options?: MiddlewareInvokeOptions,
): Promise<[MiddlewareResponse, ServerAuthState]> => {
  if (typeof middleware !== 'function') {
    setupServerStore(req, middlewareDefaultAuthProviderState)

    return [MiddlewareResponse.next(), middlewareDefaultAuthProviderState]
  }

  const mwReq = new MiddlewareRequest(req)
  let mwRes: MiddlewareResponse = MiddlewareResponse.next()

  try {
    const output =
      (await middleware(mwReq, MiddlewareResponse.next(), options)) ||
      MiddlewareResponse.next()

    // Error out early, incase user returns something else from the middleware
    // Returning nothing is still fine!
    if (output instanceof MiddlewareResponse) {
      mwRes = output
    } else {
      console.error('Return from middleware >> ', output)
      console.error('\n----\n')
      throw new Error(
        'Invalid return type from middleware. You must return a ' +
          'MiddlewareResponse or nothing at all',
      )
    }
  } catch (e) {
    console.error('Error executing middleware > \n')
    console.error('~'.repeat(80))
    console.error(e)
    console.error('~'.repeat(80))
  } finally {
    // This one is for the server. We may want to move this up as a app.use middleware
    // if we use the `.run` method from AsyncLocalStorage.
    setupServerStore(req, mwReq.serverAuthContext.get())
  }

  return [mwRes, mwReq.serverAuthContext.get()]
}

const setupServerStore = (_req: Request, serverAuthState: ServerAuthState) => {
  // Init happens in app.use('*')

  setServerAuthState(serverAuthState)
}
