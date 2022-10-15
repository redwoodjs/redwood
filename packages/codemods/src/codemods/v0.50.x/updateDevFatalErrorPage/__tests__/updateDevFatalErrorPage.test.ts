import { updateDevFatalErrorPage } from '../updateDevFatalErrorPage'

describe('updateDevFatalErrorPage', () => {
  it('Replaces the JS FatalErrorPage with a new version that includes development info', async () => {
    await matchFolderTransform(updateDevFatalErrorPage, 'javascript')
  })

  it('Replaces the TS FatalErrorPage with a new version that includes development info', async () => {
    await matchFolderTransform(updateDevFatalErrorPage, 'typescript')
  })
})
