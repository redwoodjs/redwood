// /* eslint-env jest */
const fs = require('fs')
const path = require('path')

const { getConfig, getDMMF } = require('@prisma/sdk')

const { setContext } = require('@redwoodjs/graphql-server')
const { getPaths } = require('@redwoodjs/internal/dist/paths')
const { defineScenario } = require('@redwoodjs/testing/dist/api')

// Error codes thrown by [MySQL, SQLite, Postgres] when foreign key constraint
// fails on DELETE
const FOREIGN_KEY_ERRORS = [1451, 1811, 23503]
const DEFAULT_SCENARIO = 'standard'
const TEARDOWN_CACHE_PATH = path.join(
  getPaths().generated.base,
  'scenarioTeardown.json'
)
let teardownOrder = []
let originalTeardownOrder = []

const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

const isIdenticalArray = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

const configureTeardown = async () => {
  // @NOTE prisma utils are available in cli lib/schemaHelpers
  // But avoid importing them, to prevent memory leaks in jest
  const schema = await getDMMF({ datamodelPath: getPaths().api.dbSchema })
  const schemaModels = schema.datamodel.models.map((m) => m.dbName || m.name)

  // check if pre-defined delete order already exists and if so, use it to start
  if (fs.existsSync(TEARDOWN_CACHE_PATH)) {
    teardownOrder = JSON.parse(fs.readFileSync(TEARDOWN_CACHE_PATH).toString())
  }

  // check the number of models in case we've added/removed since cache was built
  if (teardownOrder.length !== schemaModels.length) {
    teardownOrder = schemaModels
  }

  // keep a copy of the original order to compare against
  originalTeardownOrder = deepCopy(teardownOrder)
}

const seedScenario = async (scenario) => {
  if (scenario) {
    const { db } = require(path.join(getPaths().api.src, 'lib', 'db'))

    const scenarios = {}
    for (const [model, namedFixtures] of Object.entries(scenario)) {
      scenarios[model] = {}
      for (const [name, createArgs] of Object.entries(namedFixtures)) {
        if (typeof createArgs === 'function') {
          scenarios[model][name] = await db[model].create(createArgs(scenarios))
        } else {
          scenarios[model][name] = await db[model].create(createArgs)
        }
      }
    }
    return scenarios
  } else {
    return {}
  }
}

const teardown = async () => {
  // Don't populate global scope, keep util functions inside teardown
  // determine what kind of quotes are needed around table names in raw SQL
  const getQuoteStyle = async () => {
    const config = await getConfig({
      datamodel: fs.readFileSync(getPaths().api.dbSchema).toString(),
    })

    switch (config.datasources?.[0]?.provider) {
      case 'mysql':
        return '`'
      default:
        return '"'
    }
  }

  const quoteStyle = await getQuoteStyle()

  const { db } = require(path.join(getPaths().api.src, 'lib', 'db'))

  for (const modelName of teardownOrder) {
    try {
      await db.$executeRawUnsafe(
        `DELETE FROM ${quoteStyle}${modelName}${quoteStyle}`
      )
    } catch (e) {
      const match = e.message.match(/Code: `(\d+)`/)
      if (match && FOREIGN_KEY_ERRORS.includes(parseInt(match[1]))) {
        const index = teardownOrder.indexOf(modelName)
        teardownOrder[index] = null
        teardownOrder.push(modelName)
      } else {
        throw e
      }
    }
  }

  // remove nulls
  teardownOrder = teardownOrder.filter((val) => val)

  // if the order of delete changed, write out the cached file again
  if (!isIdenticalArray(teardownOrder, originalTeardownOrder)) {
    originalTeardownOrder = deepCopy(teardownOrder)
    fs.writeFileSync(TEARDOWN_CACHE_PATH, JSON.stringify(teardownOrder))
  }
}

const buildScenario =
  (it) =>
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
      const testFileDir = path.parse(global.testPath)
      const testFilePath = `${testFileDir.dir}/${
        testFileDir.name.split('.')[0]
      }.scenarios`
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
          throw (
            ('UndefinedScenario',
            `There is no scenario named "${scenarioName}" in ${testFilePath}.js`)
          )
        }
      }

      const scenarioData = await seedScenario(scenario)
      result = await testFunc(scenarioData)

      return result
    })
  }

global.scenario = buildScenario(global.it)
global.scenario.only = buildScenario(global.it.only)

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
  const { db } = require(path.join(getPaths().api.src, 'lib', 'db'))
  await db.$disconnect()
})

afterEach(async () => {
  await teardown()
})
