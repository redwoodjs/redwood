import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.PostCreateArgs>({
  post: {
    one: { data: { title: 'String', body: 'String', authorId: 9506177 } },
    two: { data: { title: 'String', body: 'String', authorId: 5418544 } },
  },
})

export type StandardScenario = typeof standard
