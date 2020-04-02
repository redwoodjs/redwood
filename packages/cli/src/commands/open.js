import execa from 'execa'
import { getConfig } from '@redwoodjs/internal'

export const command = 'open'
export const desc = 'Open your project in your browser.'
export const handler = () => {
  execa(`open http://localhost:${getConfig().web.port}`, { shell: true })
}
