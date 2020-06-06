import * as paths from '../paths'
import { getSides, isTypescript, hasDb } from '../project'

paths.getPaths = jest.fn(() => {
  return {
    base: './fixtures',
    api: {
      db: './fixtures/api/prisma',
      dbSchema: './fixtures/api/prisma/schema.prisma',
    },
  }
})

describe('project', () => {
  describe('getSides', () => {
    it('it returns all sides', () => {
      expect(getSides()[1]).toEqual('web')
    })
  })
  describe('isTypescript', () => {})
  describe('hasDb', () => {})
})
