export type MockName = string

export let MOCK_DATA: Record<MockName, any> = {}

export function mockData<T>(data: T, name: MockName): T {
  if (MOCK_DATA[name]) {
    throw new Error(`Mock data for "${name}" already exists.`)
  }
  MOCK_DATA[name] = data

  return data
}

export const getMockData = (name: MockName) => {
  if (!MOCK_DATA[name]) {
    // The user might be trying to retrieve a key that they've set themselves.
    const originalName = name.split(':')[1]
    if (MOCK_DATA[originalName]) {
      return MOCK_DATA[originalName]
    }
    throw new Error(`No mock data available for "${name}".`)
  }
  return MOCK_DATA[name]
}

export const resetMockData = () => {
  MOCK_DATA = {}
}
