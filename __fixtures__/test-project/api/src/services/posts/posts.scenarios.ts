import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.PostCreateArgs>({
  post: {
    one: { data: { title: 'String', body: 'String', authorId: 1806529 } },
    two: { data: { title: 'String', body: 'String', authorId: 9657621 } },
  },
})

export type StandardScenario = typeof standard
