export const authDecoder = async (
  token: string,
  type: string
): Promise<null | Record<string, unknown>> => {
  if (type !== 'firebase') {
    return null
  }

  // Use require here to prevent dependency for non-firebase projects
  const admin = require('firebase-admin')

  return admin.auth().verifyIdToken(token)
  // Alternative third-party JWT verification process described here:
  // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
}
