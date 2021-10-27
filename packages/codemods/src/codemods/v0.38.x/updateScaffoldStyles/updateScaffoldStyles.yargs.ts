import task from 'tasuku'

import { updateScaffoldStyles } from './updateScaffoldStyles'

export const command = 'update-scaffold-styles'
export const description =
  '(v0.37->v0.38) Update your scaffold.css file with an input error style'

export const handler = () => {
  task('Update scaffold styles', async () => {
    updateScaffoldStyles()
  })
}
