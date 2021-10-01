const userCreateOrConnect = {
  user: {
    connectOrCreate: {
      create: {
        email: 'mockedemail@example.com',
        id: 'mocked-user-123',
      },
      where: {
        id: 'mocked-user-123',
      },
    },
  },
}

export const standard = defineScenario<Prisma.TapeCreateArgs, 'tape'>({
  tape: {
    one: {
      url: 'https://tapes.bucket/one.mp4',
      active: true,
      ...userCreateOrConnect,
    },
    two: {
      url: 'https://tapes.bucket/two.mp4',
      active: true,
      ...userCreateOrConnect,
    },
    three: {
      url: 'https://tapes.bucket/three.mp4',
      shareSlug: 'share-slug-to-find',
      active: true,
      ...userCreateOrConnect,
    },
    expired: {
      url: 'https://tapes.bucket/four.mp4',
      active: false,
      expired: true,
      ...userCreateOrConnect,
    },
  },
})
