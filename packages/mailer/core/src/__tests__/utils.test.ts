import { convertAddresses } from '../utils'

describe('convertAddresses', () => {
  test('string passthrough', () => {
    const addresses = ['alice@example.com', 'bob@example.com']
    expect(convertAddresses(addresses)).toStrictEqual(addresses)
  })
  test('object without name', () => {
    const addresses = [
      { address: 'alice@example.com' },
      { address: 'bob@example.com' },
    ]
    expect(convertAddresses(addresses)).toStrictEqual([
      'alice@example.com',
      'bob@example.com',
    ])
  })
  test('object with name', () => {
    const addresses = [
      { address: 'alice@example.com', name: 'Alice McExampleton' },
      { address: 'bob@example.com', name: 'Bob Testinger' },
    ]
    expect(convertAddresses(addresses)).toStrictEqual([
      'Alice McExampleton <alice@example.com>',
      'Bob Testinger <bob@example.com>',
    ])
  })
})
