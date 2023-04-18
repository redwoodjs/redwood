import React from 'react'

const typeNames = new Map<string | null, string>([
  ['http', 'HTTP'],
  ['sql', 'SQL'],
  ['redwood-service', 'Redwood Service'],
  ['graphql', 'GraphQL'],
  ['prisma', 'Prisma'],
  ['null', 'Generic'],
])

const typeColours = new Map<string | null, string>([
  ['http', 'bg-blue-100 text-blue-800'],
  ['sql', 'bg-yellow-100 text-yellow-800'],
  ['redwood-service', 'bg-green-100 text-green-800'],
  ['graphql', 'bg-purple-100 text-purple-800'],
  ['prisma', 'bg-pink-100 text-pink-800'],
  ['null', 'bg-gray-100 text-gray-800'],
])

export default function SpanTypeLabel({
  type,
  count,
}: {
  type: string
  count?: number
}) {
  if (count) {
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${typeColours.get(
          type
        )}`}
      >
        {count}x {typeNames.get(type)}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${typeColours.get(
        type
      )}`}
    >
      {typeNames.get(type)}
    </span>
  )
}
