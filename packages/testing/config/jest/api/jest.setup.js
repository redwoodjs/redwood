// /* eslint-env jest */
// @ts-check

// @NOTE without these imports in the setup file, mockCurrentUser
// and defineScenario remain undefined in the user's tests
// Remember to use specific imports
const { setContext } = require('@redwoodjs/graphql-server/dist/globalContext')

// @NOTE we do this because jest.setup.js runs every time in each worker
// while jest-preset runs once. This significantly reduces memory footprint, and testing time
// The key is to reduce the amount of imports in this file because of how jest handles require caching
const { configureTeardown, teardown, disconnect, buildScenario } =
  global.__RWJS__TEST_IMPORTS

global.scenario = buildScenario(global.it, global.testPath)
global.scenario.only = buildScenario(global.it.only, global.testPath)

global.mockCurrentUser = (currentUser) => {
  setContext({ currentUser })
}

beforeAll(async () => {
  // Disable perRequestContext for tests
  process.env.DISABLE_CONTEXT_ISOLATION = '1'
  await configureTeardown()
})

afterAll(async () => {
  await disconnect()
})

afterEach(async () => {
  await teardown()
})
