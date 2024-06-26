// import { test, expect } from '@jest/globals'

export const standard = defineScenario({
  backgroundJob: {
    email: {
      data: {
        id: 1,
        handler: JSON.stringify({ handler: 'EmailJob', args: [123] }),
        queue: 'email',
        priority: 50,
        runAt: '2021-04-30T15:35:19Z',
      },
    },

    multipleAttempts: {
      data: {
        id: 2,
        attempts: 10,
        handler: JSON.stringify({ handler: 'TestJob', args: [123] }),
        queue: 'default',
        priority: 50,
        runAt: '2021-04-30T15:35:19Z',
      },
    },

    maxAttempts: {
      data: {
        id: 3,
        attempts: 24,
        handler: JSON.stringify({ handler: 'TestJob', args: [123] }),
        queue: 'default',
        priority: 50,
        runAt: '2021-04-30T15:35:19Z',
      },
    },
  },
})

// test('truth', () => {
//   expect(true)
// })
