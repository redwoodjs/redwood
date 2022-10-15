import {
  context as globalContext,
  getAsyncStoreInstance,
  setContext,
} from '../../globalContext'

describe('Global context with context isolation', () => {
  beforeAll(() => {
    process.env.DISABLE_CONTEXT_ISOLATION = '0'
  })

  it('Should work when assigning directly into context', async () => {
    const asyncStore = getAsyncStoreInstance()

    asyncStore.run(new Map(), () => {
      // This is the actual test
      globalContext.myNewValue = 'bazinga'

      expect(globalContext.myNewValue).toBe('bazinga')
    })

    // Check that context was isolated
    expect(globalContext.myNewValue).not.toBe('bazinga')
  })

  it('Should work when using setContext', async () => {
    const asyncStore = getAsyncStoreInstance()

    asyncStore.run(new Map(), () => {
      // This is the actual test
      setContext({ anotherValue: 'kittens' })

      expect(globalContext.anotherValue).toBe('kittens')
    })

    // Check that context was isolated
    expect(globalContext.anotherValue).not.toBe('kittens')
  })
})
