export const firebase = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  // Use require here, to prevent needing clerk sdk in api deps
  const admin = require('firebase-admin')

  return admin.auth().verifyIdToken(token)
  // Alternative is to use process described for third-party JWT verification
  // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
}
