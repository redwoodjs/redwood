import { PrismaClient } from '@prisma/client'

import { InMemoryClient } from '../clients/InMemoryClient'
import { createCache } from '../index'

const mockFindFirst = jest.fn()
const mockFindMany = jest.fn()
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
    },
  })),
}))

describe('cacheFindMany', () => {
  beforeEach(() => {
    mockFindFirst.mockClear()
    mockFindMany.mockClear()
  })

  it('adds the collection to the cache based on latest updated user', async () => {
    const now = new Date()
    const user = {
      id: 1,
      email: 'rob@redwoodjs.com',
      updatedAt: now,
    }
    mockFindFirst.mockImplementation(() => user)
    mockFindMany.mockImplementation(() => [user])

    const client = new InMemoryClient()
    const { cacheFindMany } = createCache(client)

    await cacheFindMany('test', PrismaClient().user)

    expect(client.storage[`test-1-${now.getTime()}`].value).toEqual(
      JSON.stringify([user])
    )
  })

  it('adds a new collection if a record has been updated', async () => {
    let now = new Date()
    const user = {
      id: 1,
      email: 'rob@redwoodjs.com',
      updatedAt: now,
    }
    const client = new InMemoryClient({
      [`test-1-${now.getTime()}`]: {
        expires: 1977175194415,
        value: JSON.stringify([user]),
      },
    })

    // set mock to return user that's been updated in the future, rather than
    // the timestamp that's been cached already
    let future = new Date()
    future.setSeconds(future.getSeconds + 1000)
    user.updatedAt = future
    mockFindFirst.mockImplementation(() => user)
    mockFindMany.mockImplementation(() => [user])

    const { cacheFindMany } = createCache(client)

    await cacheFindMany('test', PrismaClient().user)

    // the `now` cache still exists
    expect(
      JSON.parse(client.storage[`test-1-${now.getTime()}`].value)[0].id
    ).toEqual(1)
    // the `future` cache should have been created
    expect(client.storage[`test-1-${future.getTime()}`].value).toEqual(
      JSON.stringify([user])
    )
  })
})
