import { describe, expect, it } from 'tstyche'

import { RedwoodJob } from '../RedwoodJob'

describe('perform()', () => {
  it('respects the types of its arguments', () => {
    class TypeSafeJob extends RedwoodJob<[number]> {
      perform(id: number) {
        return id
      }
    }

    expect(new TypeSafeJob().perform).type.toBe<(id: number) => number>()
  })
})

describe('performNow()', () => {
  type TPerformArgs = [{ id: string }]

  it('has the same function signature as perform()', () => {
    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform({ id }: TPerformArgs[0]) {
        return id.toUpperCase()
      }
    }

    const job = new TypeSafeJob()

    expect(job.performNow).type.toBe<(args: TPerformArgs[0]) => string>()
    expect(job.performNow).type.toBe<typeof job.perform>()
    expect(job.performNow).type.toBe(job.perform)
  })

  it('has the correct return type', () => {
    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform({ id }: TPerformArgs[0]) {
        return id.toUpperCase()
      }
    }

    const job = new TypeSafeJob()
    const returnValue = job.performNow({ id: 'id_1' })

    // Regular method
    expect(returnValue).type.toBeString()

    // Static method
    expect(TypeSafeJob.performNow({ id: 'id_2' })).type.toBeString()
  })

  it('can take more than one parameter in a typesafe way', () => {
    type TPerformArgs = [number, string]

    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform(num: number, str: string) {
        return { num, str }
      }
    }

    const job = new TypeSafeJob()
    const returnValue = job.performNow(1, 'str')

    expect(returnValue).type.toBe<{ num: number; str: string }>()
  })
})

describe('performLater()', () => {
  type TPerformArgs = [{ id: string }]

  it('has the same arg types as perform()', () => {
    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform({ id }: TPerformArgs[0]) {
        return id.toUpperCase()
      }
    }

    const job = new TypeSafeJob()

    expect<Parameters<(typeof job)['performLater']>>().type.toBe<TPerformArgs>()
    expect<Parameters<(typeof job)['performLater']>>().type.toBe<
      Parameters<(typeof job)['perform']>
    >()
  })

  it('has the correct return type', () => {
    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform({ id }: TPerformArgs[0]) {
        return id.toUpperCase()
      }
    }

    const job = new TypeSafeJob()
    const returnValue = job.performLater({ id: 'id_1' })

    // Regular method
    // TODO: Fix this test. It should probably not be `.toBeString()`
    expect(returnValue).type.toBeString()

    // Static method
    // TODO: Fix this test. It should probably not be `.toBeString()`
    expect(TypeSafeJob.performLater({ id: 'id_2' })).type.toBeString()
  })

  it('can take more than one parameter in a typesafe way', () => {
    type TPerformArgs = [number, string]

    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform(num: number, str: string) {
        return { num, str }
      }
    }

    const job = new TypeSafeJob()
    const returnValue = job.performLater(1, 'str')

    expect(returnValue).type.toBe<{ num: number; str: string }>()
  })

  it('errors with the wrong number of args', () => {
    type TPerformArgs = [number, string]

    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform(num: number, str: string) {
        return { num, str }
      }
    }

    const job = new TypeSafeJob()

    expect(job.performLater(4)).type.toRaiseError(
      'Expected 2 arguments, but got 1',
    )

    expect(job.performLater(4, 'bar', 'baz')).type.toRaiseError(
      'Expected 2 arguments, but got 3',
    )
  })

  it('errors with the wrong type of args', () => {
    type TPerformArgs = [number, string]

    class TypeSafeJob extends RedwoodJob<TPerformArgs> {
      perform(num: number, str: string) {
        return { num, str }
      }
    }

    const job = new TypeSafeJob()

    expect(job.performLater(4, 5)).type.toRaiseError(
      "Argument of type 'number' is not assignable to parameter of type 'string'.",
    )
  })
})
