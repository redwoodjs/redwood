export const standard = defineScenario({
  user: {
    rob: {
      data: {
        email: 'rob@redwoodjs.com',
        name: 'Rob Cameron',
        hashedPassword: 'abcd',
        salt: '1234',
      },
    },
    tom: {
      data: {
        email: 'tom@redwoodjs.com',
        name: 'Tom Preston-Werner',
        hashedPassword: 'abcd',
        salt: '1234',
      },
    },
  },
  post: {
    rob: (scenario) => ({
      data: {
        userId: scenario.user.rob.id,
        title: 'Rob first post',
      },
    }),
    tom: (scenario) => ({
      data: {
        userId: scenario.user.tom.id,
        title: 'Tom first post',
      },
    }),
  },
  category: {
    wood: (scenario) => ({
      data: {
        name: 'Wood',
        posts: {
          connect: [{ id: scenario.post.rob.id }],
        },
      },
    }),
    metal: (scenario) => ({
      data: {
        name: 'Metal',
        posts: {
          connect: [{ id: scenario.post.tom.id }],
        },
      },
    }),
  },
})
