import task from 'tasuku'

import { updateDevFatalErrorPage } from './updateDevFatalErrorPage'

export const command = 'update-dev-fatal-error-page'
export const description =
  '(v0.46->v0.47) Update Fatal Error Page with development version from the create-redwood-app template'

export const handler = () => {
  task('Update Fatal Error Page with development version', async () => {
    await updateDevFatalErrorPage()
  })
}
