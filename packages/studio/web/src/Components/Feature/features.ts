import {
  CircleStackIcon,
  CodeBracketIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

export const featureDisplayNames = new Map<string, string>([
  ['sql', 'SQL'],
  ['http', 'HTTP'],
  ['prisma', 'Prisma'],
  ['redwood-service', 'RedwoodJS Service'],
  ['redwood-function', 'RedwoodJS Function'],
  ['graphql', 'GraphQL'],
])

export const featureIcons = new Map<string, typeof CircleStackIcon>([
  ['sql', CircleStackIcon],
  ['http', CodeBracketIcon],
  ['prisma', CodeBracketIcon],
  ['redwood-service', CodeBracketIcon],
  ['redwood-function', CodeBracketIcon],
  ['graphql', ShareIcon],
])

export const featureColours = new Map<string, string>([
  ['sql', 'text-cyan-500'],
  ['http', 'text-black'],
  ['prisma', 'text-[#5a67d8]'],
  ['redwood-service', 'text-[#370617]'],
  ['redwood-function', 'text-[#370617]'],
  ['graphql', 'text-fuchsia-500'],
])
