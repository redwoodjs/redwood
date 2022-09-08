/* eslint-env jest */
/* global globalThis */
// @ts-check

// @NOTE without these imports in the setup file, mockCurrentUser
// and defineScenario remain undefined in the user's tests
// Remember to use specific imports
const { setContext } = require('@redwoodjs/graphql-server/dist/globalContext')

// @NOTE we do this because jest.setup.js runs every time in each worker
// while jest-preset runs once. This significantly reduces memory footprint, and testing time
// The key is to reduce the amount of imports in this file because of how jest handles require caching
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
 * The value __RWJS_TEST_PRISMA_WAS_IMPORTED is set by babel-plugin-redwood-test-db -
 * which is only used in api jest tests - see packages/testing/config/jest/api/apiBabelConfig.js
 *
 * Doing this means if the db isn't used in the current test context,
 * no need to do any of the teardown logic - allowing simple tests to run faster
 * At the same time, if the db is used, disconnecting it in this context prevents connection limit errors.
 * Just disconnecting db in jest-preset is not enough, because
 * the Prisma client is created in a different context.
 */

beforeAll(async () => {
  // Disable perRequestContext for tests
  process.env.DISABLE_CONTEXT_ISOLATION = '1'
  if (globalThis.__RWJS_TEST_PRISMA_WAS_IMPORTED) {
    await configureTeardown()
  }
})

afterAll(async () => {
  if (globalThis.__RWJS_TEST_PRISMA_WAS_IMPORTED) {
    const { db } = require(`${apiSrcPath}/lib/db`)
    db.$disconnect()
  }
})

afterEach(async () => {
  if (globalThis.__RWJS_TEST_PRISMA_WAS_IMPORTED) {
    await teardown()
  }
})
