export type MockName = string

let MOCK_DATA: Record<MockName, any> = {}

export const resetMockData = () => {
  MOCK_DATA = {}
}

/**
 * Save mock data in a global store.
 *
 * `mockData` can be a bit magical because it's supported by a Redwood babel-plugin
 * that automatically determines the name from the named export and file location.
 *
 * @example: Magical-mock-data
 * ```js
 * // ComponentName/ComponentName.mock.js
 * export const standard = mockData({ answer: 42 })
 *
 * // ComponentName/ComponentName.stories.js
 * export const generated = () => {
 *    return <ComponentName {...mockData('standard')} />
 * }
 * ```
 */
export const mockData = (data: any, name?: MockName) => {
  if (!name) {
    return data
  }
  if (MOCK_DATA[name]) {
    throw new Error(`A mock with "${name}" already exists.`)
  }

  MOCK_DATA[name] = data
  return data
}
export const __RW__mockData = mockData

/**
 * Get the mock data associated to `name`
 */
export const getMockData = (name: MockName) => {
  if (!MOCK_DATA[name]) {
    throw new Error(`A mock with "${name}" does not exist.`)
  }
  return MOCK_DATA[name]
}
export const __RW__getMockData = getMockData
