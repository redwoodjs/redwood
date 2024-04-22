import { authDecoder } from '@redwoodjs/auth-supabase-api'
import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'

export interface SupabaseAuthMiddlewareOptions {
  getCurrentUser: GetCurrentUser
}

export const createSupabaseAuthMiddleware = ({
  getCurrentUser,
}: SupabaseAuthMiddlewareOptions) => {
  return async (req: MiddlewareRequest) => {
    const res = MiddlewareResponse.next()

    const cookieHeader = req.headers.get('Cookie')

    // Unauthenticated request
    if (!cookieHeader) {
      return null
    }

    // @WARN: Authdecoders still take event and context
    // @TODO: is the decodedSession the same as jwt.decode?
    try {
      const decodedSession = await authDecoder(cookieHeader, 'supabase', {
        event: {} as any,
        context: {} as any,
      })

      const currentUser = await getCurrentUser(decodedSession, {
        schema: 'cookie',
        // @MARK: We pass the entire cookie header as a token. This isn't actually the token!
        token: cookieHeader,
        type: 'supabase',
      })

      req.serverAuthContext.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata: currentUser, //should this be from supabase and not just currentUser?
        cookieHeader: cookieHeader,
      })

      return res
    } catch (e) {
      // Clear server auth context
      console.error(e, 'Error decoding session')
      req.serverAuthContext.set(null)

      // Clear the supabase cookie?
      // todo: check if this is necessary
      // Clear the provider cookie
      res.cookies.clear('auth-provider')
    }

    return res
  }
}
