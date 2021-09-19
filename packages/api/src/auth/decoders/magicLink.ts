export const magicLink = (token: string) => {
  if (!process.env.MAGICLINK_PUBLIC) {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      console.warn(
        'MAGICLINK_PUBLIC env var is not set. Be certain to set this value in Production.'
      )
    } else {
      console.error('Magic Auth configuration error.')
      throw new Error('Magic Auth configuration error.')
    }
  }
  return token
}
