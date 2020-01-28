import {
  mapServicesToSchema,
  makeMergedSchema,
} from '../makeMergedSchema/makeMergedSchema'
import { ImportedSchemas, Services } from '../types'

import * as postsSchema from './fixtures/graphql/posts.sdl'
import * as postsService from './fixtures/services/posts'

describe('makeMergedSchema', () => {
  describe('mapServicesToSchema', () => {
    const importedSchemas: ImportedSchemas = { posts: postsSchema }
    const importedServices: Services = { posts: postsService }

    it('It adds service function exports to resolvers', () => {
      const { schemas, resolvers } = mapServicesToSchema({
        schemas: importedSchemas,
        services: importedServices,
      })
      expect(resolvers.Query.blog()).toEqual("I'm a service.")
    })
  })
})
