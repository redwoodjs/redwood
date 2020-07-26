require('@testing-library/jest-dom')
require('whatwg-fetch')

const { startMSW, SERVER_INSTANCE } = require('@redwoodjs/testing')

// TODO: Import all mock files.

beforeAll(() => {
  startMSW()
})

afterAll(() => {
  SERVER_INSTANCE?.close()
})
