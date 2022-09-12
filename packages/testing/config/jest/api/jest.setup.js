/* eslint-env jest */
// @ts-check

// @NOTE without these imports in the setup file, mockCurrentUser
// will remain undefined in the user's tests
// Remember to use specific imports
const { setContext } = require('@redwoodjs/graphql-server/dist/globalContext')

// @NOTE we do this because jest.setup.js runs every time in each worker
// while jest-preset runs once. This significantly reduces memory footprint, and testing time
// The key is to reduce the amount of imports in this file, because the require.cache is not shared between each test context
const { configureTeardown, teardown, buildScenario, apiSrcPath } =
  global.__RWJS__TEST_IMPORTS

global.scenario = buildScenario(global.it, global.testPath)
global.scenario.only = buildScenario(global.it.only, global.testPath)

global.mockCurrentUser = (currentUser) => {
  setContext({ currentUser })
}

/**
 *
 * All these hooks run in the VM/Context that the test runs in since we're using "setupAfterEnv".
 * There's a new context for each test-suite i.e. each test file
 *
 * Doing this means if the db isn't used in the current test context,
 * no need to do any of the teardown logic - allowing simple tests to run faster
 * At the same time, if the db is used, disconnecting it in this context prevents connection limit errors.
 * Just disconnecting db in jest-preset is not enough, because
 * the Prisma client is created in a different context.
 */
const wasDbUsed = () =>
  Object.keys(require.cache).some((module) => {
    return (
      module === `${apiSrcPath}/lib/db.js` ||
      module === `${apiSrcPath}/lib/db.ts`
    )
  })

beforeAll(async () => {
  // Disable perRequestContext for tests
  process.env.DISABLE_CONTEXT_ISOLATION = '1'
  if (wasDbUsed()) {
    await configureTeardown()
  }
})

afterAll(async () => {
  if (wasDbUsed()) {
    const { db } = require(`${apiSrcPath}/lib/db`)
    db.$disconnect()
  }
})

afterEach(async () => {
  if (wasDbUsed()) {
    await teardown()
  }
})
