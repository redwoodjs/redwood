// This file is used by the VSCode GraphQL Extension

import type { IGraphQLConfig } from 'graphql-config'

import { getPaths } from '@redwoodjs/project-config'

const config: IGraphQLConfig = {
  schema: getPaths().generated.schema,
  documents: './web/src/**/!(*.d).{ts,tsx,js,jsx}',
}

export default config
