const path = require('path')
const { getPaths } = require('@redwoodjs/internal')
const { db } = require(path.join(getPaths().api.src, 'lib', 'db'))
const DEFAULT_SCENARIO = 'standard'
const PRISMA_RESERVED = ['create', 'connect']

const findNestedModels = (data) => {
  let models = []

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === 'object') {
      if (!models.includes(field) && !PRISMA_RESERVED.includes(field)) {
        models.push(field)
      }
      models = models.concat(findNestedModels(value))
    }
  }

  return models
}

const seedFixtures = async (scenario) => {
  if (scenario) {
    const fixtures = {}
    for (const [model, namedFixtures] of Object.entries(scenario)) {
      fixtures[model] = {}
      for (const [name, data] of Object.entries(namedFixtures)) {
        fixtures[model][name] = await db[model].create({ data })
      }
    }
    return fixtures
  } else {
    return {}
  }
}

const removeFixtures = async (scenario) => {
  if (scenario) {
    let models = []

    for (const [model, namedFixtures] of Object.entries(scenario)) {
      models.push(model)
      for (const [_name, data] of Object.entries(namedFixtures)) {
        models = models.concat(findNestedModels(data))
      }
    }
    models = Array.from(new Set(models))

    for (const model of models) {
      await db.$queryRaw(`DELETE FROM ${model}`)
    }
  }
}

window.scenario = (...args) => {
  let scenarioName, testName, testFunc

  if (args.length === 3) {
    ;[scenarioName, testName, testFunc] = args
  } else {
    scenarioName = DEFAULT_SCENARIO
    ;[testName, testFunc] = args
  }

  return window.it(testName, async () => {
    const path = require('path')
    const testFileDir = path.parse(window.jasmine.testPath)
    const testFilePath = `${testFileDir.dir}/${
      testFileDir.name.split('.')[0]
    }.fixtures`
    let allFixtures, scenario, result

    try {
      allFixtures = require(testFilePath)
    } catch (e) {
      // no fixture file found, ignore
    }

    if (allFixtures) {
      if (allFixtures[scenarioName]) {
        scenario = allFixtures[scenarioName]
      } else {
        throw (
          ('UndefinedScenario',
          `There is no scenario named "${scenarioName}" in ${testFilePath}.js`)
        )
      }
    }

    const fixtures = await seedFixtures(scenario)
    try {
      result = await testFunc(fixtures)
    } finally {
      // if the test fails this makes sure we still remove fixtures
      await removeFixtures(scenario)
    }

    return result
  })
}

afterAll(async () => {
  await db.$disconnect()
})
