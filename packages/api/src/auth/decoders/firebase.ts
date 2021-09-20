export const firebase = (token: string) => {
  if (!process.env.FIREBASE_API_KEY) {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      console.warn(
        'FIREBASE_API_KEY env var is not set. Be certain to set this value in Production.'
      )
    } else {
      console.error('Firebase auth configuration error.')
      throw new Error('Firebase auth configuration error.')
    }
  }
  return token
}
