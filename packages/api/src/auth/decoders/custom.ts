export const custom = (token: string) => {
  if (!process.env.CUSTOM_AUTH_SECRET) {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      console.warn(
        'CUSTOM_AUTH_SECRET env var is not set. Be certain to set this value in Production.'
      )
    } else {
      console.error('Custom Redwood Auth configuration error.')
      throw new Error('Custom Redwood Auth configuration error.')
    }
  }
  return token
}
