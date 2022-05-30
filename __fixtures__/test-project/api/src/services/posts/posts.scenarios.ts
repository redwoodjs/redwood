import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.PostCreateArgs>({
  post: {
    one: { data: { title: 'String', body: 'String', authorId: 6606511 } },
    two: { data: { title: 'String', body: 'String', authorId: 6666550 } },
  },
})

export type StandardScenario = typeof standard
