import task from 'tasuku'

import { renameApiProxyPath } from './renameApiProxyPath'

export const command = 'rename-api-proxy-path'
export const description = '(v0.37->v0.38) Renames apiProxyPath to apiURL'

export const handler = () => {
  task('Rename apiProxyPath', async () => {
    renameApiProxyPath()
  })
}
