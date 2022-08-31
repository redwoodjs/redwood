// /* eslint-env jest */
// @ts-check

// @NOTE without these imports in the setup file, mockCurrentUser
// and defineScenario remain undefined in the user's tests
const { setContext } = require('@redwoodjs/graphql-server/dist/globalContext')
const { defineScenario } = require('@redwoodjs/testing/dist/api')

// @NOTE we do this because jest.setup.js runs every time in each worker
// while jest-preset runs once. This significantly reduces memory footprint, and testing time
// The key is to reduce the amount of imports in this file because of how jest handles require caching
const { configureTeardown, teardown, disconnect, seedScenario } =
  global.__RWJS__TEST_IMPORTS

const DEFAULT_SCENARIO = 'standard'

// @NOTE without this function in jest-setup, secnario comes through as undefined
// Not exactly clear why...
const buildScenario =
  (it, testPath) =>
  (...args) => {
    let scenarioName, testName, testFunc

    if (args.length === 3) {
      ;[scenarioName, testName, testFunc] = args
    } else if (args.length === 2) {
      scenarioName = DEFAULT_SCENARIO
      ;[testName, testFunc] = args
    } else {
      throw new Error('scenario() requires 2 or 3 arguments')
    }

    return it(testName, async () => {
      const path = require('path')
      const testFileDir = path.parse(testPath)
      // e.g. ['comments', 'test'] or ['signup', 'state', 'machine', 'test']
      const testFileNameParts = testFileDir.name.split('.')
      const testFilePath = `${testFileDir.dir}/${testFileNameParts
        .slice(0, testFileNameParts.length - 1)
        .join('.')}.scenarios`
      let allScenarios, scenario, result

      try {
        allScenarios = require(testFilePath)
      } catch (e) {
        // ignore error if scenario file not found, otherwise re-throw
        if (e.code !== 'MODULE_NOT_FOUND') {
          throw e
        }
      }

      if (allScenarios) {
        if (allScenarios[scenarioName]) {
          scenario = allScenarios[scenarioName]
        } else {
          throw new Error(
            `UndefinedScenario: There is no scenario named "${scenarioName}" in ${testFilePath}.{js,ts}`
          )
        }
      }

      const scenarioData = await seedScenario(scenario)
      result = await testFunc(scenarioData)

      return result
    })
  }

global.scenario = buildScenario(global.it, global.testPath)
global.scenario.only = buildScenario(global.it.only, global.testPath)

global.defineScenario = defineScenario

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
