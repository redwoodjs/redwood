import {
  middlewareDefaultAuthProviderState,
  type ServerAuthState,
} from '@redwoodjs/auth'

import { MiddlewareRequest } from './MiddlewareRequest.js'
import {
  MiddlewareResponse,
  MiddlewareShortCircuit,
} from './MiddlewareResponse.js'
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
    // @TODO catch the error here, and see if its a short-circuit
    // A shortcircuit will prevent execution of all other middleware down the chain, and prevent react rendering
    if (e instanceof MiddlewareShortCircuit) {
      return [e.mwResponse, mwReq.serverAuthContext.get()]
    }

    console.error('Error executing middleware > \n')
    console.error('~'.repeat(80))
    console.error(e)
    console.error('~'.repeat(80))
  }

  return [mwRes, mwReq.serverAuthContext.get()]
}
