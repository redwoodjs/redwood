import React from 'react'

import { Badge } from '@tremor/react'

type tailwindColours =
  | 'red'
  | 'green'
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | undefined

const typeNames = new Map<string | null, string>([
  ['http', 'HTTP'],
  ['sql', 'SQL'],
  ['redwood-service', 'Redwood Service'],
  ['redwood-function', 'Redwood Function'],
  ['graphql', 'GraphQL'],
  ['prisma', 'Prisma'],
  [null, 'Generic'],
])

const typeColours = new Map<string | null, tailwindColours>([
  ['http', 'blue'],
  ['sql', 'yellow'],
  ['redwood-service', 'green'],
  ['redwood-function', 'green'],
  ['graphql', 'purple'],
  ['prisma', 'pink'],
  [null, 'gray'],
])

export default function SpanTypeLabel({
  type,
  count,
  padLeft,
}: {
  type: string | null
  count?: number
  padLeft?: boolean
}) {
  if (count) {
    return (
      <Badge
        className={`px-3.5 py-0.5 ${padLeft ? 'ml-2' : ''}`}
        color={`${typeColours.get(type || null) || 'gray'}`}
      >
        {count}x {typeNames.get(type || null)}
      </Badge>
    )
  }
  return (
    <Badge
      className={`px-3.5 py-0.5 ${padLeft ? 'ml-2' : ''}`}
      color={`${typeColours.get(type || null) || 'gray'}`}
    >
      {typeNames.get(type || null)}
    </Badge>
  )
}
