import task from 'tasuku'

import { updateNodeEngine } from './updateNodeEngine'

export const command = 'update-node-engine'
export const description =
  '(v0.37->v0.38) Update the node engine field in the root package.json'

export const handler = () => {
  task('Update node engine', async () => {
    updateNodeEngine()
  })
}
