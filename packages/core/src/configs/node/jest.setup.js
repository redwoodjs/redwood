const path = require('path')

const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

const { db } = require(path.join(redwoodPaths.api.src, 'lib', 'db'))

const findNestedModels = (data) => {
  let models = []

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === 'object') {
      if (models.indexOf(field) === -1) {
        models.push(field)
      }
      models = models.concat(findNestedModels(field))
    }
  }

  return models
}

window.jestIt = window.it
window.it = (...args) => {
  return window.jestIt(args[0], async (done) => {
    let scenarioName = 'standard'
    let testFunc = args[2]
    // is the second param a function (default `test` call) or is an options argument
    // included with the name of the scenario to use
    if (typeof args[1] === 'function') {
      testFunc = args[1]
    } else {
      scenarioName = args[1]['scenario']
    }

    const path = require('path')
    const testFileDir = path.parse(window.jasmine.testPath)
    const testFilePath = `${testFileDir.dir}/${
      testFileDir.name.split('.')[0]
    }.fixtures`
    const fixtures = {}
    let usingScenarios = true
    let allFixtures
    let teardownModels = []

    try {
      allFixtures = require(testFilePath)
    } catch (e) {
      usingScenarios = false
    }

    if (usingScenarios) {
      const scenario = allFixtures[scenarioName]

      if (typeof scenario === 'undefined') {
        throw (
          ('UndefinedFixture',
          `There is no scenario named "${scenarioName}" in ${testFilePath}.js`)
        )
      }

      // seed fixtures
      for (const [model, namedFixtures] of Object.entries(scenario)) {
        fixtures[model] = {}
        teardownModels.push(model)
        for (const [name, data] of Object.entries(namedFixtures)) {
          teardownModels = teardownModels.concat(findNestedModels(data))
          fixtures[model][name] = await db[model].create({ data })
        }
      }

      // uniqify the list of models we need to delete from
      teardownModels = Array.from(new Set(teardownModels))
    }

    // run actual test
    await testFunc(fixtures, done)

    // delete fixtures
    if (usingScenarios) {
      for (const model of teardownModels) {
        await db.$queryRaw(`DELETE FROM ${model}`)
      }
    }

    done()
  })
}
window.test = window.it

afterAll(async () => {
  await db.$disconnect()
})
