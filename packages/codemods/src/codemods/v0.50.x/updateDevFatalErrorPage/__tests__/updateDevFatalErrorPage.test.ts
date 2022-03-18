import { updateDevFatalErrorPage } from '../updateDevFatalErrorPage'

describe('updateDevFatalErrorPage', () => {
  it('Replaces the FatalErrorPage with a new version that includes development info', async () => {
    await matchFolderTransform(updateDevFatalErrorPage, 'default')
  })
})
