import { runPrerender } from '@redwoodjs/prerender'

export const command = 'prerender'
export const aliases = ['render']
export const description = 'Prerender pages of a redwood app (experimental)'

export const handler = async () => {
  runPrerender()
}
