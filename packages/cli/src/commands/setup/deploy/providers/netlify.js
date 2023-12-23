export const command = 'netlify'
export const description = 'Setup Netlify deploy'

export async function handler(options) {
  const { handler } = await import('./netlifyHandler.js')
  return handler(options)
}
