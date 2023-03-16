import React from 'react'

import { useQuery, gql } from '@apollo/client'
import {
  CircleStackIcon,
  CodeBracketIcon,
  RadioIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

import CountCard from '../Components/CountCard'

const QUERY_GET_SPAN_COUNTS = gql`
  query GetSpanCount {
    graphQLSpanCount
    sqlCount
    traceCount
  }
`

function App() {
  const { loading, error, data } = useQuery(QUERY_GET_SPAN_COUNTS, {
    pollInterval: 1000,
  })

  return (
    <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
      <div>
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Development Studio
        </h3>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CountCard
            title="OpenTelemetry Traces"
            colouring="emerald-500"
            icon={RadioIcon}
            link="/tracing"
            loading={loading}
            error={error}
            value={data?.traceCount}
          ></CountCard>
          <CountCard
            title="Service Function Calls"
            colouring="fuchsia-600"
            icon={CodeBracketIcon}
            link="/coming-soon"
            loading={false}
            error={undefined}
            value={undefined}
          ></CountCard>
          <CountCard
            title="SQL Queries"
            colouring="cyan-600"
            icon={CircleStackIcon}
            link="/sql"
            loading={loading}
            error={error}
            value={data?.sqlCount}
          ></CountCard>
          <CountCard
            title="GraphQL Resolver Calls"
            colouring="orange-600"
            icon={ShareIcon}
            link="/coming-soon"
            loading={loading}
            error={error}
            value={data?.graphQLSpanCount}
          ></CountCard>
        </dl>
      </div>
    </div>
  )
}

export default App
