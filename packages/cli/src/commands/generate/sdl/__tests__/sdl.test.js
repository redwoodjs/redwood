global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'
import { getDefaultArgs } from 'src/lib'

import * as sdl from '../sdl'

afterEach(() => {
  jest.clearAllMocks()
})

const extensionForBaseArgs = (baseArgs) =>
  baseArgs && baseArgs.typescript ? 'ts' : 'js'

const itReturnsExactlyThreeFiles = (baseArgs = {}) => {
  test('returns exactly 3 files', async () => {
    const files = await sdl.files({ ...baseArgs, name: 'Post', crud: false })

    expect(Object.keys(files).length).toEqual(3)
  })
}

// in this case we'll trust that a service and test are actually created
// with the correct filename, but the contents of that file should be the
// job of the service tests
const itCreatesAService = (baseArgs = {}) => {
  test('creates a service', async () => {
    const files = await sdl.files({ ...baseArgs, name: 'User', crud: false })
    const extension = extensionForBaseArgs(baseArgs)

    expect(files).toHaveProperty([
      path.normalize(
        `/path/to/project/api/src/services/users/users.${extension}`
      ),
    ])
    expect(files).toHaveProperty([
      path.normalize(
        `/path/to/project/api/src/services/users/users.test.${extension}`
      ),
    ])
  })
}

const itCreatesASingleWordSDLFile = (baseArgs = {}) => {
  test('creates a single word sdl file', async () => {
    const files = await sdl.files({ ...baseArgs, name: 'User' })
    const extension = extensionForBaseArgs(baseArgs)

    expect(
      files[
        path.normalize(
          `/path/to/project/api/src/graphql/users.sdl.${extension}`
        )
      ]
    ).toEqual(loadGeneratorFixture('sdl', `singleWordSdl.${extension}`))
  })
}

const itCreatesAMultiWordSDLFile = (baseArgs = {}) => {
  test('creates a multi word sdl file', async () => {
    const files = await sdl.files({
      ...baseArgs,
      name: 'UserProfile',
    })
    const extension = extensionForBaseArgs(baseArgs)

    expect(
      files[
        path.normalize(
          `/path/to/project/api/src/graphql/userProfiles.sdl.${extension}`
        )
      ]
    ).toEqual(loadGeneratorFixture('sdl', `multiWordSdl.${extension}`))
  })
}

const itCreatesASingleWordSDLFileWithCRUD = (baseArgs = {}) => {
  test('creates a single word sdl file with CRUD actions', async () => {
    const files = await sdl.files({ ...baseArgs, name: 'Post', crud: true })
    const extension = extensionForBaseArgs(baseArgs)

    expect(
      files[
        path.normalize(
          `/path/to/project/api/src/graphql/posts.sdl.${extension}`
        )
      ]
    ).toEqual(loadGeneratorFixture('sdl', `singleWordSdlCrud.${extension}`))
  })
}

const itCreateAMultiWordSDLFileWithCRUD = (baseArgs = {}) => {
  test('creates a multi word sdl file with CRUD actions', async () => {
    const files = await sdl.files({
      ...baseArgs,
      name: 'UserProfile',
      crud: true,
    })
    const extension = extensionForBaseArgs(baseArgs)

    expect(
      files[
        path.normalize(
          `/path/to/project/api/src/graphql/userProfiles.sdl.${extension}`
        )
      ]
    ).toEqual(loadGeneratorFixture('sdl', `multiWordSdlCrud.${extension}`))
  })
}

const itCreatesASDLFileWithEnumDefinitions = (baseArgs = {}) => {
  test('creates a sdl file with enum definitions', async () => {
    const files = await sdl.files({ ...baseArgs, name: 'Shoe', crud: true })
    const extension = extensionForBaseArgs(baseArgs)

    expect(
      files[
        path.normalize(
          `/path/to/project/api/src/graphql/shoes.sdl.${extension}`
        )
      ]
    ).toEqual(loadGeneratorFixture('sdl', `enumGeneratedSdl.${extension}`))
  })
}

describe('in javascript mode', () => {
  const baseArgs = getDefaultArgs(sdl.defaults)

  itReturnsExactlyThreeFiles(baseArgs)
  itCreatesAService(baseArgs)
  itCreatesASingleWordSDLFile(baseArgs)
  itCreatesAMultiWordSDLFile(baseArgs)
  itCreatesASingleWordSDLFileWithCRUD(baseArgs)
  itCreateAMultiWordSDLFileWithCRUD(baseArgs)
  itCreatesASDLFileWithEnumDefinitions(baseArgs)
})

describe('in typescript mode', () => {
  const baseArgs = { ...getDefaultArgs(sdl.defaults), typescript: true }

  itReturnsExactlyThreeFiles(baseArgs)
  itCreatesAService(baseArgs)
  itCreatesASingleWordSDLFile(baseArgs)
  itCreatesAMultiWordSDLFile(baseArgs)
  itCreatesASingleWordSDLFileWithCRUD(baseArgs)
  itCreateAMultiWordSDLFileWithCRUD(baseArgs)
  itCreatesASDLFileWithEnumDefinitions(baseArgs)
})
