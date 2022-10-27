global.__dirname = __dirname
import path from 'path'

// Load mocks
import '../../../../lib/test'

import { getDefaultArgs } from '../../../../lib'
import { yargsDefaults as defaults } from '../../../generate'
import * as scaffold from '../scaffold'

jest.mock('execa')

describe('editable columns', () => {
  let files
  let form

  beforeAll(async () => {
    files = await scaffold.files({
      ...getDefaultArgs(defaults),
      model: 'ExcludeDefault',
      tests: true,
      nestScaffoldByModel: true,
    })
    form =
      files[
        path.normalize(
          '/path/to/project/web/src/components/ExcludeDefault/ExcludeDefaultForm/ExcludeDefaultForm.js'
        )
      ]
  })

  test('includes String fields with a default string', async () => {
    expect(form).toMatch('name="foobar"')
  })

  test('includes String fields with a default cuid', async () => {
    expect(form).toMatch('name="cuid"')
  })

  test('includes String fields with a default uuid', async () => {
    expect(form).toMatch('name="uuid"')
  })

  test('includes Int fields with a default', async () => {
    expect(form).toMatch('name="number"')
  })

  test('includes DateTime fields', async () => {
    expect(form).toMatch('name="otherTime"')
  })

  test('excludes @id fields', async () => {
    expect(form).not.toMatch('name="id"')
  })

  test('excludes @updatedAt fields', async () => {
    expect(form).not.toMatch('name="updatedTime"')
  })

  test('excludes autoincrement() default fields', async () => {
    expect(form).not.toMatch('name="auto"')
  })

  test('excludes now() default fields', async () => {
    expect(form).not.toMatch('name="nowTime"')
  })
})
