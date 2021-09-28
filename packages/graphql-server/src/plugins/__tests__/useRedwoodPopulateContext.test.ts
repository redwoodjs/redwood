import { createSpiedPlugin, createTestkit } from '@envelop/testing'

import { testSchema, testQuery } from '../__fixtures__/common'
import { useRedwoodPopulateContext } from '../useRedwoodPopulateContext'

describe('Populates context', () => {
  const spiedPlugin = createSpiedPlugin()

  const expectContextContains = (obj) => {
    expect(spiedPlugin.spies.beforeContextBuilding).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining(obj),
      })
    )
  }

  beforeEach(() => {
    spiedPlugin.reset()
  })

  it('Should extend context based on output of function', async () => {
    const populateContextSpy = jest.fn(() => {
      return {
        bazinga: true,
      }
    })

    const testkit = createTestkit(
      [
        useRedwoodPopulateContext(populateContextSpy),
        // @NOTE add spy here to check if context has been changed
        spiedPlugin.plugin,
      ],
      testSchema
    )

    await testkit.execute(testQuery, {}, {})

    expect(populateContextSpy).toHaveBeenCalled()
    expectContextContains({ bazinga: true })
  })

  it('Should extend context with an object, if one is provided', async () => {
    const populateContextSpy = jest.fn(() => {
      return {
        bazinga: true,
      }
    })

    const testkit = createTestkit(
      [
        useRedwoodPopulateContext({
          dtWasHere: 'hello!',
        }),
        // @NOTE add spy here to check if context has been changed
        spiedPlugin.plugin,
      ],
      testSchema
    )

    await testkit.execute(testQuery, {}, {})

    expect(populateContextSpy).not.toHaveBeenCalled()
    expectContextContains({ dtWasHere: 'hello!' })
  })
})
