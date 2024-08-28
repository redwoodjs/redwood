import type { Stall } from '@prisma/client'

import { stalls, stall, createStall, updateStall, deleteStall } from './stalls'
import type { StandardScenario } from './stalls.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('stalls', () => {
  scenario('returns all stalls', async (scenario: StandardScenario) => {
    const result = await stalls()

    expect(result.length).toEqual(Object.keys(scenario.stall).length)
  })

  scenario('returns a single stall', async (scenario: StandardScenario) => {
    const result = await stall({ id: scenario.stall.one.id })

    expect(result).toEqual(scenario.stall.one)
  })

  scenario('creates a stall', async () => {
    const result = await createStall({
      input: { name: 'String', stallNumber: 'String7681055' },
    })

    expect(result.name).toEqual('String')
    expect(result.stallNumber).toEqual('String7681055')
  })

  scenario('updates a stall', async (scenario: StandardScenario) => {
    const original = (await stall({ id: scenario.stall.one.id })) as Stall
    const result = await updateStall({
      id: original.id,
      input: { name: 'String2' },
    })

    expect(result.name).toEqual('String2')
  })

  scenario('deletes a stall', async (scenario: StandardScenario) => {
    const original = (await deleteStall({ id: scenario.stall.one.id })) as Stall
    const result = await stall({ id: original.id })

    expect(result).toEqual(null)
  })
})
