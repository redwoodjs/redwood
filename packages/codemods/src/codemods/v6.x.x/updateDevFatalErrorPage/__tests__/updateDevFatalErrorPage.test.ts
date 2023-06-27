import { updateDevFatalErrorPage } from '../updateDevFatalErrorPage'

describe('updateDevFatalErrorPage', () => {
  it('Replaces the js FatalErrorPage with a new version that uses a regular import', async () => {
    await matchFolderTransform(updateDevFatalErrorPage, 'js')
  })

  it('Replaces the jsx FatalErrorPage with a new version that uses a regular import', async () => {
    await matchFolderTransform(updateDevFatalErrorPage, 'jsx')
  })

  it('Replaces the tsx FatalErrorPage with a new version that uses a regular import', async () => {
    await matchFolderTransform(updateDevFatalErrorPage, 'tsx')
  })
})
