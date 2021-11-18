import * as Errors from '../../errors'
import Core from '../Core'

import datamodel from './datamodel.json'

// Mock Prisma
const db = { user: jest.fn() }

// Setup Core
Core.schema = datamodel
Core.db = db

// Test Models
class Post extends Core {
  static requiredModels = []
}
class User extends Core {
  static requiredModels = []
}
Post.requiredModels = [User]
User.requiredModels = [Post]

afterEach(() => {
  db.user.mockClear()
})

describe('static methods', () => {
  it('returns the name of itself', () => {
    expect(Core.name).toEqual('Core')
  })

  it('returns the db object', () => {
    expect(Core.db).toEqual(db)
  })

  it('defaults `accessor` property to undefined', () => {
    expect(Core.accessorName).toEqual(undefined)
  })

  it('can override the accessor name if needed', () => {
    class TestClass extends Core {
      static accessorName = 'TesterTable'
    }

    expect(TestClass.accessorName).toEqual('TesterTable')
  })

  it('defaults `primaryKey`', () => {
    expect(Core.primaryKey).toEqual('id')
  })

  it('stores the parsed schema.prisma', () => {
    expect(Core.schema).toHaveProperty('models')
  })
})

describe('instance methods', () => {
  describe('build()', () => {
    it('instantiates with a list of attributes', () => {
      const attrs = { foo: 'bar' }
      const record = Core.build(attrs)

      expect(record.attributes).toEqual(attrs)
    })

    it('creates getters for each attribute', () => {
      const record = Core.build({ foo: 'bar' })

      expect(record.foo).toEqual('bar')
    })

    it('creates setters for each attribute', () => {
      const record = Core.build({ foo: 'bar' })
      record.foo = 'baz'

      expect(record.foo).toEqual('baz')
    })

    it('skips getters/setters with a `create` or `connect` child key', () => {
      const connect = Core.build({ id: 1, posts: { connect: { id: 2 } } })
      expect(connect.posts).toEqual(undefined)

      const create = Core.build({ id: 1, comments: { create: { id: 2 } } })
      expect(create.comments).toEqual(undefined)
    })
  })
})

// Subclass behavior, needs to be backed by an actual model to work

describe.only('User subclass', () => {
  describe('static methods', () => {
    describe('accessor', () => {
      it('returns table representation on prisma client', () => {
        expect(User.accessor).toEqual(db.user)
      })
    })

    describe('where', () => {
      it('returns an array of User records', async () => {
        db.user.findMany = jest.fn(() => [
          {
            id: 1,
            email: 'rob@redwoodjs.com',
          },
        ])

        const where = { email: 'rob@redwoodjs.com' }
        await User.where(where)

        expect(db.user.findMany).toHaveBeenCalledWith({ where })
      })
    })

    describe('all', () => {
      it('is an alias for where', async () => {
        db.user.findMany = jest.fn(() => [
          {
            id: 1,
            email: 'rob@redwoodjs.com',
          },
        ])

        expect(await User.all()).toEqual(await User.where())
      })
    })

    describe('create', () => {
      it('initializes and saves a new record from a list of attributes', async () => {
        const attributes = {
          email: 'peter@redwoodjs.com',
          name: 'Peter Pistorius',
          hashedPassword: 'abc',
          salt: 'abc',
        }
        db.user.create = jest.fn(() => ({ id: 1, ...attributes }))

        const user = await User.create(attributes)

        expect(db.user.create).toHaveBeenCalledWith({ data: attributes })
        expect(user instanceof User).toEqual(true)
        expect(user.id).not.toEqual(undefined)
        expect(user.email).toEqual('peter@redwoodjs.com')
        expect(user.name).toEqual('Peter Pistorius')
      })
    })

    describe('find', () => {
      it('finds a user by ID', async () => {
        const id = 1
        db.user.findFirst = jest.fn(() => ({
          id,
          email: 'rob@redwoodjs.com',
        }))
        const user = await User.find(id)

        expect(db.user.findFirst).toHaveBeenCalledWith({ where: { id } })
        expect(user.id).toEqual(id)
      })

      it('throws RedwoodRecordNotFound if ID is not found', async () => {
        db.user.findFirst = jest.fn(() => null)

        try {
          await User.find(999999999)
        } catch (e) {
          expect(e instanceof Errors.RedwoodRecordNotFoundError).toEqual(true)
          expect(e.message).toEqual('User record not found')
        }
        expect.assertions(2)
      })
    })

    xdescribe('findBy', () => {
      it('returns the first record if no arguments', async (scenario) => {
        const user = await User.findBy()

        expect(user.id).toEqual(scenario.user.rob.id)
      })

      it('returns the first record that matches the given attributes', async (scenario) => {
        const user = await User.findBy({ email: 'tom@redwoodjs.com' })

        expect(user.id).toEqual(scenario.user.tom.id)
      })

      it('returns null if no records', async () => {
        await db.$executeRawUnsafe(`DELETE from Post`)
        await db.$executeRawUnsafe(`DELETE from User`)

        expect(await User.findBy()).toEqual(null)
      })
    })

    xdescribe('first', () => {
      it('is an alias for findBy', async (scenario) => {
        expect(await User.first({ email: scenario.user.rob.email })).toEqual(
          await User.findBy({ email: scenario.user.rob.email })
        )
      })
    })
  })

  xdescribe('instance methods', () => {
    describe('create', () => {
      it('can create a record', async () => {
        const user = await User.create({
          email: `${Math.random()}@redwoodjs.com`,
          hashedPassword: 'abc',
          salt: 'abc',
        })

        expect(user.id).not.toEqual(undefined)
      })
    })

    describe('destroy', () => {
      it('deletes a record', async (scenario) => {
        // delete posts ahead of time to avoid foreign key error
        await db.$executeRawUnsafe(`DELETE from Post`)

        const user = User.build(scenario.user.tom)
        await user.destroy()

        await expect(User.find(user.id)).rejects.toThrow(
          Errors.RedwoodRecordNotFoundError
        )
      })

      it('returns the record that was deleted', async (scenario) => {
        // delete posts ahead of time to avoid foreign key error
        await db.$executeRawUnsafe(`DELETE from Post`)

        const user = User.build(scenario.user.tom)
        const result = await user.destroy()

        expect(result).toEqual(user)
      })

      it('returns false if record not found', async () => {
        const user = User.build({ id: 99999999 })

        expect(await user.destroy()).toEqual(false)
      })

      it('throws an error if given the option', async () => {
        const user = User.build({ id: 99999999 })

        await expect(user.destroy({ throw: true })).rejects.toThrow(
          Errors.RedwoodRecordNotFoundError
        )
      })
    })

    describe('save', () => {
      describe('create', () => {
        it('returns true if create is successful', async () => {
          const email = `${Math.random()}@email.com`
          const user = await User.build({
            email,
            hashedPassword: 'abc',
            salt: 'abc',
          })
          const result = await user.save()

          expect(result.id).not.toEqual(undefined)
          expect(result.email).toEqual(email)
        })

        it('returns false if create fails', async () => {
          const user = await User.build()
          const result = await user.save()

          expect(result).toEqual(false)
        })

        it('throws error if given the option', async () => {
          const user = await User.build()
          try {
            await user.save({ throw: true })
          } catch (e) {
            expect(
              e instanceof Errors.RedwoodRecordMissingAttributeError
            ).toEqual(true)
          }
          expect.assertions(1)
        })
      })

      describe('update', () => {
        it('returns true if update is successful', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.email = 'updated@redwoodjs.com'
          const result = await user.save()

          expect(result.email).toEqual('updated@redwoodjs.com')
        })

        it('returns false if update fails', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.id = 999999999
          const result = await user.save()

          expect(result).toEqual(false)
        })

        it('throws on failed save if given the option', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.id = 999999999

          try {
            await user.save({ throw: true })
          } catch (e) {
            expect(e instanceof Errors.RedwoodRecordNotFoundError).toEqual(true)
          }

          expect.assertions(1)
        })

        it('throws on null required field if given the option', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.email = null // email is required in schema

          try {
            await user.save({ throw: true })
          } catch (e) {
            expect(e instanceof Errors.RedwoodRecordNullAttributeError).toEqual(
              true
            )
          }

          expect.assertions(1)
        })
      })
    })

    xdescribe('update', () => {
      it('updates an existing record with new data', async (scenario) => {
        const user = await User.build(scenario.user.rob)
        const result = await user.update({ name: 'Robert Cameron' })

        expect(result instanceof User).toEqual(true)
        expect(user.name).toEqual('Robert Cameron')
      })
    })
  })
})
