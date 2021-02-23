import fs from 'fs'

import { addConfigToIndex } from '../auth'

// jest.mock('src/lib')
jest.mock('src/lib', () => {
  // const path = require('path')
  // const __dirname = path.resolve()
  return {
    getPaths: () => ({
      api: { functions: '', src: '', lib: '' },
      web: {
        src: '',
      },
    }),
  }
})

// This function checks output matches
const writeFileSyncSpy = jest.fn((filePath, content) => {
  expect(content).toMatchSnapshot()
})

beforeEach(() => {
  jest.restoreAllMocks()
  jest.spyOn(fs, 'writeFileSync').mockImplementation(writeFileSyncSpy)
  jest.spyOn(fs, 'readFileSync').mockImplementation(
    () => `const App = () => (
		<FatalErrorBoundary page={FatalErrorPage}>
			<RedwoodApolloProvider>
				<Routes />
			</RedwoodApolloProvider>
		</FatalErrorBoundary>
	)`
  )
})

describe('Should add config lines to index.js', () => {
  it('Matches Auth0 Snapshot', async () => {
    const auth0Data = await import(`../providers/auth0`)
    await addConfigToIndex(auth0Data.config, false)
  })

  it('Matches Firebase Snapshot', async () => {
    const firebaseData = await import(`../providers/firebase`)
    await addConfigToIndex(firebaseData.config, false)
  })

  it('Matches netlify Snapshot', async () => {
    const netlifyData = await import(`../providers/netlify`)
    await addConfigToIndex(netlifyData.config, false)
  })

  it('Matches goTrue Snapshot', async () => {
    const goTrueData = await import(`../providers/goTrue`)
    await addConfigToIndex(goTrueData.config, false)
  })

  it('Matches azureActiveDirectory Snapshot', async () => {
    const azureActiveDirectoryData = await import(
      `../providers/azureActiveDirectory`
    )
    await addConfigToIndex(azureActiveDirectoryData.config, false)
  })

  it('Matches ethereum Snapshot', async () => {
    const ethereumData = await import(`../providers/ethereum`)
    await addConfigToIndex(ethereumData.config, false)
  })

  it('Matches magicLink Snapshot', async () => {
    const magicLinkData = await import(`../providers/magicLink`)
    await addConfigToIndex(magicLinkData.config, false)
  })

  it('Matches supabase Snapshot', async () => {
    const supabaseData = await import(`../providers/supabase`)
    await addConfigToIndex(supabaseData.config, false)
  })

  it('Matches nhost Snapshot', async () => {
    const nhostData = await import(`../providers/nhost`)
    await addConfigToIndex(nhostData.config, false)
  })
})
