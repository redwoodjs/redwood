export const command = 'baremetal'
export const description = 'Setup Baremetal deploy'

export async function handler(options) {
  const { handler } = await import('./baremetalHandler.js')
  return handler(options)
}
