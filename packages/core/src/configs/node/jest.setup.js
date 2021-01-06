const path = require('path')

const { getPaths } = require('@redwoodjs/internal')
const { defineScenario } = require('@redwoodjs/testing/dist/scenario')
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

const seedScenario = async (scenario) => {
  if (scenario) {
    const scenarios = {}
    for (const [model, namedFixtures] of Object.entries(scenario)) {
      scenarios[model] = {}
      for (const [name, data] of Object.entries(namedFixtures)) {
        scenarios[model][name] = await db[model].create({ data })
      }
    }
    return scenarios
  } else {
    return {}
  }
}

const removeScenario = async (scenario) => {
  if (scenario) {
    let models = []

    for (const [model, namedFixtures] of Object.entries(scenario)) {
      models.push(model)
      for (const [_name, data] of Object.entries(namedFixtures)) {
        models = models.concat(findNestedModels(data))
      }
    }
    // get unique model names only
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
  } else if (args.length === 2) {
    scenarioName = DEFAULT_SCENARIO
    ;[testName, testFunc] = args
  } else {
    throw new Error('scenario() requires 2 or 3 arguments')
  }

  return window.it(testName, async () => {
    const path = require('path')
    const testFileDir = path.parse(window.jasmine.testPath)
    const testFilePath = `${testFileDir.dir}/${
      testFileDir.name.split('.')[0]
    }.scenarios`
    let allScenarios, scenario, result

    try {
      allScenarios = require(testFilePath)
    } catch (e) {
      // no scenario file found, ignore
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
    try {
      result = await testFunc(scenarioData)
    } finally {
      // if the test fails this makes sure we still remove scenario data
      await removeScenario(scenario)
    }

    return result
  })
}

window.defineScenario = defineScenario

afterAll(async () => {
  await db.$disconnect()
})
