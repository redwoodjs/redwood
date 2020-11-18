global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as service from '../service'

describe('the scenario generator', () => {
  test('parseSchema returns an object with required, non-relation scalar fields', async () => {
    const { scalarFields } = await service.parseSchema('User')

    expect(scalarFields).toEqual([
      {
        hasDefaultValue: false,
        isGenerated: false,
        isId: false,
        isList: false,
        isReadOnly: false,
        isRequired: true,
        isUnique: true,
        isUpdatedAt: false,
        kind: 'scalar',
        name: 'email',
        type: 'String',
      },
    ])
  })

  test('parseSchema returns an empty object when no relation fields', async () => {
    const { relations } = await service.parseSchema('User')

    expect(relations).toEqual({})
  })

  test('parseSchema returns an object with relation fields', async () => {
    const { relations } = await service.parseSchema('UserProfile')

    expect(relations).toEqual({ user: ['userId'] })
  })

  test('scenarioFieldValue returns a plain string for non-unique String types', () => {
    const field = { type: 'String', isUnique: false }

    expect(service.scenarioFieldValue(field)).toEqual('String')
  })

  test('scenarioFieldValue returns a unique string for unique String types', () => {
    const field = { type: 'String', isUnique: true }

    expect(service.scenarioFieldValue(field)).toMatch(/^String\d{6,7}$/)
  })

  test('scenarioFieldValue returns a number for Int types', () => {
    const field = { type: 'Int' }

    expect(typeof service.scenarioFieldValue(field)).toEqual('number')
  })

  test('scenarioFieldValue returns an ISO8601 timestamp for DateTime types', () => {
    const field = { type: 'DateTime' }

    expect(service.scenarioFieldValue(field)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    )
  })

  test('fieldsToScenario returns scenario data for scalarFields', async () => {
    const scalarFields = [
      {
        name: 'firstName',
        type: 'String',
        isUnique: false,
      },
      {
        name: 'lastName',
        type: 'String',
        isUnique: true,
      },
    ]
    const scenario = await service.fieldsToScenario(scalarFields, [])

    expect(Object.keys(scenario).length).toEqual(2)
    expect(scenario.firstName).toEqual('String')
    expect(scenario.lastName).toMatch(/^String\d{6,7}$/)
  })
})
