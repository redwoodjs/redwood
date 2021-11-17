import * as ValidationErrors from '@redwoodjs/api'

import RedwoodRecord from '../RedwoodRecord'
import Reflection from '../Reflection'
import RelationProxy from '../RelationProxy'

describe('reflect()', () => {
  it('returns instance of Reflection', () => {
    expect(RedwoodRecord.reflect instanceof Reflection).toEqual(true)
  })
})

describe('build()', () => {
  class Post extends RedwoodRecord {}
  class User extends RedwoodRecord {}
  class Comment extends RedwoodRecord {}
  User.requiredModels = [Post, Comment]

  it('adds relation properties', () => {
    const user = User.build({})

    expect(user.posts instanceof RelationProxy).toEqual(true)
  })
})

describe('save()', () => {
  it('returns false if save fails', async () => {
    class User extends RedwoodRecord {
      static validates = {
        email: { presence: true },
      }
    }
    const user = new User()

    expect(await user.save()).toEqual(false)
  })

  it('throws an error if given the option', async () => {
    class User extends RedwoodRecord {
      static validates = {
        email: { presence: true },
      }
    }
    const user = new User()

    expect(user.save({ throw: true })).rejects.toThrow(
      ValidationErrors.PresenceValidationError
    )
  })

  it('adds an error if not valid before saving', async () => {
    class User extends RedwoodRecord {
      static validates = {
        email: { presence: true },
      }
    }
    const user = new User()
    await user.save()

    expect(user.errors.email).toEqual(['email must be present'])
  })
})

describe('_createPropertyForAttribute()', () => {
  it('creates error attribute placeholders', () => {
    const attrs = { foo: 'bar' }
    const record = RedwoodRecord.build(attrs)

    expect(record.errors.foo).toEqual([])
  })
})

describe('_onSaveError()', () => {
  class Post extends RedwoodRecord {}
  class User extends RedwoodRecord {}
  class Comment extends RedwoodRecord {}
  User.requiredModels = [Post, Comment]

  scenario('returns false if save fails', async (scenario) => {
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    expect(await user.save()).toEqual(false)
  })

  scenario('adds an error if save fails', async (scenario) => {
    const user = await User.find(scenario.user.rob.id)
    user.email = null
    await user.save()

    expect(user.errors.email).toEqual(['must not be null'])
  })
})
