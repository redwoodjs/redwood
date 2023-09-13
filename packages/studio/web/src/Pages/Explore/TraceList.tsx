import React, { useContext } from 'react'

import { useQuery, gql } from '@apollo/client'
import { ClockIcon } from '@heroicons/react/20/solid'
import { CubeTransparentIcon } from '@heroicons/react/24/outline'
import { Badge, Card, Flex, Title, Text } from '@tremor/react'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import InformationPanel from '../../Components/Panels/InformationPanel'
import SpanTypeLabel from '../../Components/Span/SpanTypeLabel'
import { SearchFilterContext } from '../../Context/SearchFilterContextProvider'
import { LIST_POLLING_INTERVAL } from '../../util/polling'
import {
  getTraceName,
  hasAnyErrors,
  traceDuration,
  traceRootSpan,
  traceStart,
} from '../../util/trace'

const QUERY_GET_ALL_TRACES = gql`
  query GetAllTraces($searchFilter: String) {
    rows: traces(searchFilter: $searchFilter) {
      id
      spans {
        id
        type
        name
        brief
        parent
        statusCode
        startNano
        endNano
      }
    }
  }
`

function getBrief(spans: any[]) {
  const graphQLSpan = spans.find(
    (span) => span.type === 'graphql' && span.brief !== 'Anonymous Operation'
  )
  if (graphQLSpan) {
    return graphQLSpan.brief
  }
  return traceRootSpan(spans)?.brief
}

function TraceListComponent({ traces }: { traces: any[] }) {
  if (traces.length === 0) {
    return <InformationPanel message={{ message: 'No data to show here' }} />
  }

  return (
    <>
      {traces.map((row: any) => {
        const typeCountMap = new Map<string | null, number>()
        row.spans.forEach((span: any) => {
          const type = span.type
          typeCountMap.set(type, (typeCountMap.get(type) || 0) + 1)
        })

        return (
          <Card
            className="min-w-full max-w-full mb-2 flex flex-row gap-3 hover:bg-gray-50 transition-colors duration-75 ease-in-out"
            key={row.id}
          >
            <Link
              to={`/explorer/trace/${row.id}`}
              className="flex-1 flex-col items-start min-w-0"
            >
              <Flex>
                <Title className="flex-1 truncate">{getBrief(row.spans)}</Title>
                <Badge
                  size="lg"
                  className="px-3.5 py-0.5"
                  color={hasAnyErrors(row.spans) ? 'red' : 'green'}
                >
                  {hasAnyErrors(row.spans) ? 'Error' : 'Ok/Unset'}
                </Badge>
              </Flex>
              <Flex className="border-b border-gray-200 pb-2 mb-2">
                <Text>
                  {row.id} | {getTraceName(row.spans)}
                </Text>
              </Flex>
              <Flex className="justify-start flex-wrap">
                {Array.from(typeCountMap.keys())
                  .sort()
                  .map((type: string | null, index) => (
                    <SpanTypeLabel
                      key={type}
                      type={type}
                      count={typeCountMap.get(type)}
                      padLeft={index !== 0}
                    />
                  ))}
              </Flex>
              <Flex className="justify-end mt-2">
                <ClockIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                <Text>
                  {new Date(
                    parseInt(traceStart(row.spans).slice(0, -6), 10)
                  ).toLocaleString()}
                  , duration {traceDuration(row.spans).slice(0, -6)}ms
                </Text>
              </Flex>
            </Link>
            <Link
              to={`/explorer/map/${traceRootSpan(row.spans)?.id}`}
              className="flex flex-shrink-0 bg-rich-black text-white rounded-md items-center justify-center px-2 min-h-full"
            >
              <CubeTransparentIcon className="h-full w-6" />
            </Link>
          </Card>
        )
      })}
    </>
  )
}

const bigIntMin = (...args: bigint[]) => args.reduce((m, e) => (e < m ? e : m))

export default function TraceList() {
  const [{ tracesFilter: searchFilter }] = useContext(SearchFilterContext)

  const { loading, error, data } = useQuery(QUERY_GET_ALL_TRACES, {
    pollInterval: LIST_POLLING_INTERVAL,
    variables: {
      searchFilter,
    },
  })

  const traces: any[] = data?.rows !== undefined ? [...data.rows] : []
  traces.sort((a: any, b: any) => {
    const aStart = bigIntMin(...a.spans.map((span: any) => span.startNano))
    const bStart = bigIntMin(...b.spans.map((span: any) => span.startNano))
    return aStart > bStart ? -1 : bStart > aStart ? 1 : 0
  })

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md flex justify-between">
            <div>OpenTelemetry Traces</div>
            <div>{traces.length && `(${traces.length})`}</div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-2">
        {error ? (
          <ErrorPanel error={error} />
        ) : loading ? (
          <div className="flex justify-center mt-4">
            <LoadingSpinner />
          </div>
        ) : (
          <TraceListComponent traces={traces} />
        )}
      </div>
    </div>
  )
}
