const path = require('path')

const camelCase = require('lodash/camelCase')

const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

const { db } = require(path.join(redwoodPaths.api.src, 'lib', 'db'))

/**
 * Loop through all db models and clear the tables before every test
 */
beforeEach(async () => {
  for (let model of db._dmmf.datamodel.models) {
    if (model.name === 'RW_DataMigration') continue

    await db[camelCase(model.name)].deleteMany()
  }
})

afterAll(async () => {
  await db.$disconnect()
})
