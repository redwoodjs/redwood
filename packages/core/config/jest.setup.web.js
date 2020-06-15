require('@testing-library/jest-dom')
require('whatwg-fetch')

const { server } = require('@redwoodjs/testing')

beforeAll(() => {
  server.listen()
})

afterAll(() => {
  server.close()
})
