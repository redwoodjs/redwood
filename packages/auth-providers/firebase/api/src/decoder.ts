import admin from 'firebase-admin'

import { Decoder } from '@redwoodjs/api'

admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
})

export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'firebase') {
    return null
  }

  return admin.auth().verifyIdToken(token)
  // Alternative third-party JWT verification process described here:
  // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
}
