import admin from 'firebase-admin'

export const firebase = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  // if (!process.env.CLERK_API_KEY) {
  //   console.error('CLERK_API_KEY env var is not set.')
  //   throw new Error('CLERK_API_KEY env var is not set.')
  // }
  return admin.auth().verifyIdToken(token)
}
