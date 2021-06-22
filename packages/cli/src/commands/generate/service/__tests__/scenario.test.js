global.__dirname = __dirname
// Load mocks
import 'src/lib/test'

import * as service from '../service'

describe('the scenario generator', () => {
  test('parseSchema returns an object with required scalar fields', async () => {
    const { scalarFields } = await service.parseSchema('UserProfile')

    expect(scalarFields).toEqual([
      {
        name: 'username',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: true,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        hasDefaultValue: false,
        isGenerated: false,
        isId: false,
        isList: false,
        isReadOnly: true,
        isRequired: true,
        isUnique: false,
        isUpdatedAt: false,
        kind: 'scalar',
        name: 'userId',
        type: 'Int',
      },
    ])
  })

  test('parseSchema returns an empty object when no relation fields', async () => {
    const { relations } = await service.parseSchema('User')

    expect(relations).toEqual({})
  })

  test('parseSchema returns an object with relation fields', async () => {
    const { relations } = await service.parseSchema('UserProfile')

    expect(relations).toEqual({
      user: { foreignKey: ['userId'], type: 'User' },
    })
  })

  test('parseSchema returns an object with foreign keys', async () => {
    const { foreignKeys } = await service.parseSchema('UserProfile')

    expect(foreignKeys).toEqual(['userId'])
  })

  test('scenarioFieldValue returns a plain string for non-unique String types', () => {
    const field = { type: 'String', isUnique: false }

    expect(service.scenarioFieldValue(field)).toEqual(expect.any(String))
  })

  test('scenarioFieldValue returns a unique string for unique String types', () => {
    const field = { type: 'String', isUnique: true }

    expect(service.scenarioFieldValue(field)).toEqual(expect.any(String))
    // contains some unique digits somewhere
    expect(service.scenarioFieldValue(field)).toMatch(/\d{1,}$/)
  })

  test('scenarioFieldValue returns a true for Boolean types', () => {
    const field = { type: 'Boolean' }

    expect(service.scenarioFieldValue(field)).toEqual(true)
  })

  test('scenarioFieldValue returns a float for Decimal types', () => {
    const field = { type: 'Decimal' }
    const value = service.scenarioFieldValue(field)

    expect(value).toEqual(parseFloat(value))
  })

  test('scenarioFieldValue returns a number for Int types', () => {
    const field = { type: 'Int' }
    const value = service.scenarioFieldValue(field)

    expect(value).toEqual(parseInt(value))
  })

  test('scenarioFieldValue returns an ISO8601 timestamp string for DateTime types', () => {
    const field = { type: 'DateTime' }
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

    expect(service.scenarioFieldValue(field)).toMatch(iso8601Regex)
  })

  test('scenarioFieldValue returns JSON for Json types', () => {
    const field = { type: 'Json' }

    expect(service.scenarioFieldValue(field)).toEqual({ foo: 'bar' })
  })

  test('scenarioFieldValue returns the first enum option for enum kinds', () => {
    const field = {
      type: 'Color',
      kind: 'enum',
      enumValues: [
        { name: 'Red', dbValue: null },
        { name: 'Blue', dbValue: null },
      ],
    }

    expect(service.scenarioFieldValue(field)).toEqual('Red')
  })

  test('scenarioFieldValue returns the dbName for enum types if present', () => {
    const field = {
      type: 'Color',
      kind: 'enum',
      enumValues: [
        { name: 'Red', dbName: 'color-red' },
        { name: 'Blue', dbName: 'color-blue' },
      ],
    }

    expect(service.scenarioFieldValue(field)).toEqual('color-red')
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
    const scenario = await service.fieldsToScenario(scalarFields, [], [])

    expect(Object.keys(scenario).length).toEqual(2)
    expect(scenario.firstName).toEqual(expect.any(String))
    expect(scenario.lastName).toEqual(expect.any(String))
    expect(scenario.lastName).toMatch(/\d{1,}$/)
  })

  test('fieldsToScenario returns scenario data for nested relations', async () => {
    const { scalarFields, relations, foreignKeys } = await service.parseSchema(
      'UserProfile'
    )

    const scenario = await service.fieldsToScenario(
      scalarFields,
      relations,
      foreignKeys
    )

    expect(scenario.user).toEqual(
      expect.objectContaining({
        create: expect.objectContaining({
          email: expect.any(String),
        }),
      })
    )
  })
})
