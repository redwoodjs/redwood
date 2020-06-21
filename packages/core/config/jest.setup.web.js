require('@testing-library/jest-dom')
require('whatwg-fetch')

const { server } = require('@redwoodjs/testing')
const camelCase = require('lodash/camelCase')
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

/**
 * Loop through all db models and clear the tables before every test
 */
beforeEach(async () => {
  for (let model of db.dmmf.datamodel.models) {
    await db[camelCase(model.name)].deleteMany()
  }
})

beforeAll(() => {
  server.listen()
})

afterAll(async () => {
  server.close()
  await db.disconnect()
})
