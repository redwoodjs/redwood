import execa from 'execa'
import { getConfig } from '@redwoodjs/core'

export const command = 'open [port]'
export const desc = 'Open your project in your browser.'
export const handler = () => {
  execa(`open http://localhost:${getConfig().web.port}`, { shell: true })
}
