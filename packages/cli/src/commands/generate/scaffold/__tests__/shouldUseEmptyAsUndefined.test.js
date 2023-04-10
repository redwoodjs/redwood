globalThis.__dirname = __dirname
import path from 'path'

// Load mocks
import '../../../../lib/test'

import { getDefaultArgs } from '../../../../lib'
import { yargsDefaults as defaults } from '../../helpers'
import * as scaffold from '../scaffold'

jest.mock('execa')

describe('relational form field', () => {
  let files
  let form

  beforeAll(async () => {
    files = await scaffold.files({
      ...getDefaultArgs(defaults),
      model: 'Tag',
      tests: true,
      nestScaffoldByModel: true,
    })
    form =
      files[
        path.normalize(
          '/path/to/project/web/src/components/Tag/TagForm/TagForm.js'
        )
      ]
  })

  test("includes optional relational fields with an emptyAs('undefined')", async () => {
    expect(form).toMatch("emptyAs={'undefined'}")
  })
})
