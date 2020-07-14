import { mockData, getMockData, resetMockData } from '../mockData'

beforeEach(() => resetMockData())

it('data can be saved and retrieved by key', () => {
  mockData({ answer: 42 }, 'TheUniversalConstant')
  expect(getMockData('TheUniversalConstant')).toMatchInlineSnapshot(`
    Object {
      "answer": 42,
    }
  `)
})

it('throws when you try to save a key twice', () => {
  mockData({ answer: 42 }, 'TheUniversalConstant')
  expect(() =>
    mockData({ answer: 42 }, 'TheUniversalConstant')
  ).toThrowErrorMatchingInlineSnapshot(
    `"A mock with \\"TheUniversalConstant\\" already exists."`
  )
})

it('throws when retrieving a key that does not exist', () => {
  expect(() =>
    getMockData('TheUniversalConstant')
  ).toThrowErrorMatchingInlineSnapshot(
    `"A mock with \\"TheUniversalConstant\\" does not exist."`
  )
})
