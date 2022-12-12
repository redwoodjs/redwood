import type FirebaseAdmin from 'firebase-admin'

import { Decoder } from '@redwoodjs/api'

export const authDecoder = (admin: typeof FirebaseAdmin) => {
  const authDecoderFn: Decoder = async (token: string, type: string) => {
    if (type !== 'firebase') {
      return null
    }

    return admin.auth().verifyIdToken(token)
    // Alternative third-party JWT verification process described here:
    // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
  }

  return authDecoderFn
}
