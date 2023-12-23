export const command = 'vercel'
export const description = 'Setup Vercel deploy'

export async function handler(options) {
  const { handler } = await import('./vercelHandler.js')
  return handler(options)
}
