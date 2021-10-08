export const firebase = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  // Use require here to prevent dependency for non-firebase projects
  const admin = require('firebase-admin')

  return admin.auth().verifyIdToken(token)

  // Alternative third-party JWT verification process described here:
  // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
}
