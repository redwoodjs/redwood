globalThis.__dirname = __dirname
import path from 'path'

// Load mocks
import '../../../../lib/test'

import { getDefaultArgs } from '../../../../lib'
import { yargsDefaults as defaults } from '../../helpers'
import * as scaffold from '../scaffold'

jest.mock('execa')

describe('support custom @id name', () => {
  let files

  beforeAll(async () => {
    files = await scaffold.files({
      ...getDefaultArgs(defaults),
      typescript: true,
      model: 'CustomIdField',
      tests: true,
      nestScaffoldByModel: true,
    })
  })

  test('creates routes with the custom id name', async () => {
    const customIdFieldRoutes = await scaffold.routes({
      model: 'CustomIdField',
      nestScaffoldByModel: true,
    })
    expect(customIdFieldRoutes).toEqual([
      '<Route path="/custom-id-fields/new" page={CustomIdFieldNewCustomIdFieldPage} name="newCustomIdField" />',
      '<Route path="/custom-id-fields/{uuid}/edit" page={CustomIdFieldEditCustomIdFieldPage} name="editCustomIdField" />',
      '<Route path="/custom-id-fields/{uuid}" page={CustomIdFieldCustomIdFieldPage} name="customIdField" />',
      '<Route path="/custom-id-fields" page={CustomIdFieldCustomIdFieldsPage} name="customIdFields" />',
    ])
  })

  test('creates a cell with the custom id name', () => {
    const customIdFieldCellPath =
      '/path/to/project/web/src/components/CustomIdField/CustomIdFieldCell/CustomIdFieldCell.tsx'

    const cell = files[path.normalize(customIdFieldCellPath)]
    expect(cell).toContain('FindCustomIdFieldByUuid($uuid: String!)')
    expect(cell).toContain('customIdField: customIdField(uuid: $uuid)')
  })

  test('creates an edit cell with the custom id name', () => {
    const customIdFieldEditCellPath =
      '/path/to/project/web/src/components/CustomIdField/EditCustomIdFieldCell/EditCustomIdFieldCell.tsx'

    const cell = files[path.normalize(customIdFieldEditCellPath)]
    expect(cell).toContain('query EditCustomIdFieldByUuid($uuid: String!)')
  })

  test('creates a component with the custom id name', () => {
    const customIdFieldComponentPath =
      '/path/to/project/web/src/components/CustomIdField/CustomIdField/CustomIdField.tsx'

    const cell = files[path.normalize(customIdFieldComponentPath)]
    expect(cell).toContain('DeleteCustomIdFieldMutation($uuid: String!)')
    expect(cell).toContain('deleteCustomIdField(uuid: $uuid)')
    expect(cell).toContain('deleteCustomIdField({ variables: { uuid } })')
  })

  test('creates a form with the custom id name', () => {
    const customIdFieldFormPath =
      '/path/to/project/web/src/components/CustomIdField/CustomIdFieldForm/CustomIdFieldForm.tsx'

    const cell = files[path.normalize(customIdFieldFormPath)]
    expect(cell).toContain('props.onSave(data, props?.customIdField?.uuid)')
  })

  test('creates a sdl with the custom id name', () => {
    const customIdFieldSdlPath =
      '/path/to/project/api/src/graphql/customIdFields.sdl.ts'

    const sdl = files[path.normalize(customIdFieldSdlPath)]
    const match = sdl.match(/uuid: String!/g)
    expect(match).toHaveLength(4)
  })

  test('creates a service with the custom id name', () => {
    const customIdFieldServicePath =
      '/path/to/project/api/src/graphql/customIdFields.sdl.ts'

    const sdl = files[path.normalize(customIdFieldServicePath)]
    const match = sdl.match(/uuid: String!/g)
    expect(match).toHaveLength(4)
  })
})
