import Core from '../Core'
import { db } from '../db'
import * as Errors from '../errors'

// General top level behavior of RedwoodRecord

class Post extends Core {
  static requiredModels = []
}
class User extends Core {
  static requiredModels = []
}
Post.requiredModels = [User]
User.requiredModels = [Post]

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

describe('User subclass', () => {
  describe('static methods', () => {
    describe('accessor', () => {
      scenario('returns table representation on prisma client', () => {
        expect(User.accessor).toEqual(db.user)
      })
    })

    describe('where', () => {
      scenario('returns an array of User records', async (scenario) => {
        const users = await User.where({ email: scenario.user.rob.email })

        expect(users.length).toEqual(1)
        expect(users[0].id).toEqual(scenario.user.rob.id)
      })
    })

    describe('all', () => {
      scenario('is an alias for where', async (scenario) => {
        expect(await User.all()).toEqual(await User.where())
      })
    })

    describe('create', () => {
      scenario(
        'initializes and saves a new record from a list of attributes',
        async () => {
          const user = await User.create({
            email: 'peter@redwoodjs.com',
            name: 'Peter Pistorius',
            hashedPassword: 'abc',
            salt: 'abc',
          })

          expect(user instanceof User).toEqual(true)
          expect(user.id).not.toEqual(undefined)
          expect(user.email).toEqual('peter@redwoodjs.com')
          expect(user.name).toEqual('Peter Pistorius')
        }
      )
    })

    describe('find', () => {
      scenario('finds a user by ID', async (scenario) => {
        const id = scenario.user.rob.id
        const user = await User.find(id)

        expect(user.id).toEqual(id)
      })

      scenario('throws RedwoodRecordNotFound if ID is not found', async () => {
        try {
          await User.find(999999999)
        } catch (e) {
          expect(e instanceof Errors.RedwoodRecordNotFoundError).toEqual(true)
          expect(e.message).toEqual('User record not found')
        }
        expect.assertions(2)
      })
    })

    describe('findBy', () => {
      scenario('returns the first record if no arguments', async (scenario) => {
        const user = await User.findBy()

        expect(user.id).toEqual(scenario.user.rob.id)
      })

      scenario(
        'returns the first record that matches the given attributes',
        async (scenario) => {
          const user = await User.findBy({ email: 'tom@redwoodjs.com' })

          expect(user.id).toEqual(scenario.user.tom.id)
        }
      )

      scenario('returns null if no records', async () => {
        await db.$executeRawUnsafe(`DELETE from Post`)
        await db.$executeRawUnsafe(`DELETE from User`)

        expect(await User.findBy()).toEqual(null)
      })
    })

    describe('first', () => {
      scenario('is an alias for findBy', async (scenario) => {
        expect(await User.first({ email: scenario.user.rob.email })).toEqual(
          await User.findBy({ email: scenario.user.rob.email })
        )
      })
    })
  })

  describe('instance methods', () => {
    describe('create', () => {
      scenario('can create a record', async () => {
        const user = await User.create({
          email: `${Math.random()}@redwoodjs.com`,
          hashedPassword: 'abc',
          salt: 'abc',
        })

        expect(user.id).not.toEqual(undefined)
      })
    })

    describe('destroy', () => {
      scenario('deletes a record', async (scenario) => {
        // delete posts ahead of time to avoid foreign key error
        await db.$executeRawUnsafe(`DELETE from Post`)

        const user = User.build(scenario.user.tom)
        await user.destroy()

        await expect(User.find(user.id)).rejects.toThrow(
          Errors.RedwoodRecordNotFoundError
        )
      })

      scenario('returns the record that was deleted', async (scenario) => {
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
        scenario('returns true if create is successful', async () => {
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

        scenario('returns false if create fails', async () => {
          const user = await User.build()
          const result = await user.save()

          expect(result).toEqual(false)
        })

        scenario('throws error if given the option', async () => {
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
        scenario('returns true if update is successful', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.email = 'updated@redwoodjs.com'
          const result = await user.save()

          expect(result.email).toEqual('updated@redwoodjs.com')
        })

        scenario('returns false if update fails', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.id = 999999999
          const result = await user.save()

          expect(result).toEqual(false)
        })

        scenario(
          'throws on failed save if given the option',
          async (scenario) => {
            const user = await User.build(scenario.user.rob)
            user.id = 999999999

            try {
              await user.save({ throw: true })
            } catch (e) {
              expect(e instanceof Errors.RedwoodRecordNotFoundError).toEqual(
                true
              )
            }

            expect.assertions(1)
          }
        )

        scenario(
          'throws on null required field if given the option',
          async (scenario) => {
            const user = await User.build(scenario.user.rob)
            user.email = null // email is required in schema

            try {
              await user.save({ throw: true })
            } catch (e) {
              expect(
                e instanceof Errors.RedwoodRecordNullAttributeError
              ).toEqual(true)
            }

            expect.assertions(1)
          }
        )
      })
    })

    describe('update', () => {
      scenario('updates an existing record with new data', async (scenario) => {
        const user = await User.build(scenario.user.rob)
        const result = await user.update({ name: 'Robert Cameron' })

        expect(result instanceof User).toEqual(true)
        expect(user.name).toEqual('Robert Cameron')
      })
    })
  })
})
