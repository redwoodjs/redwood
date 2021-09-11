export const firebase = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  // Use require here, to prevent needing clerk sdk in api deps
  const admin = require('firebase-admin')

  return admin.auth().verifyIdToken(token)
}
