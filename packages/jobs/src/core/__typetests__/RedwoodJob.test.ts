import { describe, expect, vi, it, expectTypeOf } from 'vitest'

import { RedwoodJob } from '../RedwoodJob'

const mockLogger = {
  log: vi.fn(() => {}),
  info: vi.fn(() => {}),
  debug: vi.fn(() => {}),
  warn: vi.fn(() => {}),
  error: vi.fn(() => {}),
}

const mockAdapter = {
  options: {},
  logger: mockLogger,
  schedule: vi.fn(() => {}),
  find: () => null,
  clear: () => {},
  success: (_job: { handler: string; args: any }) => {},
  failure: (_job: { handler: string; args: any }, _error: Error) => {},
}

describe('perform()', () => {
  it('respects the types of its arguments', () => {
    class TypeSafeJob extends RedwoodJob {
      perform(id: number) {
        return id
      }
    }

    TypeSafeJob.config({ adapter: mockAdapter })
    const job = new TypeSafeJob()

    expectTypeOf(job.perform).toEqualTypeOf<(id: number) => number>()
    expectTypeOf(new TypeSafeJob().perform).toEqualTypeOf<
      (id: number) => number
    >()
  })

  it('can trust the types when called through performNow', () => {
    class TypeSafeJob extends RedwoodJob {
      perform({ id }: { id: string }) {
        return id.toUpperCase()
      }
    }

    TypeSafeJob.config({ adapter: mockAdapter })
    const job = new TypeSafeJob()

    const returnValue = job.performNow({ id: 1 })

    expectTypeOf(returnValue).toBeString()
  })
})
