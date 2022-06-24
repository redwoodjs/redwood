import type { Prisma, Post } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.PostCreateArgs>({
  post: {
    one: { data: { title: 'String', body: 'String' } },
    two: { data: { title: 'String', body: 'String' } },
  },
})

export type StandardScenario = ScenarioData<Post, 'post'>
