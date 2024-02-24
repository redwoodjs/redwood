import type { EmptyUser } from '@prisma/client'

import {
  emptyUsers,
  emptyUser,
  createEmptyUser,
  updateEmptyUser,
  deleteEmptyUser,
} from './emptyUsers'
import type { StandardScenario } from './emptyUsers.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('emptyUsers', () => {
  scenario('returns all emptyUsers', async (scenario: StandardScenario) => {
    const result = await emptyUsers()

    expect(result.length).toEqual(Object.keys(scenario.emptyUser).length)
  })

  scenario('returns a single emptyUser', async (scenario: StandardScenario) => {
    const result = await emptyUser({ id: scenario.emptyUser.one.id })

    expect(result).toEqual(scenario.emptyUser.one)
  })

  scenario('creates a emptyUser', async () => {
    const result = await createEmptyUser({
      input: { email: 'String8450568' },
    })

    expect(result.email).toEqual('String8450568')
  })

  scenario('updates a emptyUser', async (scenario: StandardScenario) => {
    const original = (await emptyUser({
      id: scenario.emptyUser.one.id,
    })) as EmptyUser
    const result = await updateEmptyUser({
      id: original.id,
      input: { email: 'String82168002' },
    })

    expect(result.email).toEqual('String82168002')
  })

  scenario('deletes a emptyUser', async (scenario: StandardScenario) => {
    const original = (await deleteEmptyUser({
      id: scenario.emptyUser.one.id,
    })) as EmptyUser
    const result = await emptyUser({ id: original.id })

    expect(result).toEqual(null)
  })
})
