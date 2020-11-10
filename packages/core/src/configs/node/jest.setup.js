const path = require('path')

const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

const { db } = require(path.join(redwoodPaths.api.src, 'lib', 'db'))

window.testWithFixtures = (...args) => {
  return global.test(args[0], async (done) => {
    const path = require('path')
    const testFilePath = path.parse(window.jasmine.testPath)

    const allFixtures = require(`${testFilePath.dir}/${
      testFilePath.name.split('.')[0]
    }.fixtures`)

    // create fixtures
    const fixtures = {}
    for (const [model, dataArray] of Object.entries(allFixtures)) {
      const transFixtures = []

      for (const data of dataArray) {
        transFixtures.push(db[model].create({ data }))
      }

      fixtures[model] = await db.$transaction(transFixtures)
    }

    // run actual test
    await args[1](fixtures)

    // delete fixtures
    for (const [model] of Object.entries(fixtures)) {
      await db.$queryRaw(`DELETE FROM ${model}`)
    }

    done()
  })
}

window.itWithFixtures = window.testWithFixtures

afterAll(async () => {
  await db.$disconnect()
})
