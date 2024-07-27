import { describe, expect, it } from 'tstyche'

import { RedwoodJob } from '../RedwoodJob'

describe('perform()', () => {
  it('respects the types of its arguments', () => {
    class TypeSafeJob extends RedwoodJob {
      perform(id: number) {
        return id
      }
    }

    expect(new TypeSafeJob().perform).type.toBe<(id: number) => number>()
  })
})

describe('performNow()', () => {
  it('has the same arg types as perform()', () => {
    class TypeSafeJob extends RedwoodJob {
      perform({ id }: { id: string }) {
        return id.toUpperCase()
      }
    }

    const job = new TypeSafeJob()
    const returnValue = job.performNow({ id: 'id_1' })

    expect(returnValue).type.toBeString()
    expect(TypeSafeJob.performNow({ id: 'id_2' })).type.toBeString()
  })

  it('has the correct return type', () => {
    class TypeSafeJob extends RedwoodJob {
      perform({ id }: { id: string }) {
        return id.toUpperCase()
      }
    }

    const job = new TypeSafeJob()
    const returnValue = job.performNow({ id: 'id_1' })

    expect(returnValue).type.toBeString()
    expect(TypeSafeJob.performNow({ id: 'id_2' })).type.toBeString()
  })
})
