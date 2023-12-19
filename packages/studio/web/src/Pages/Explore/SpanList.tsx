import React, { useContext } from 'react'

import { useQuery, gql } from '@apollo/client'
import { CubeTransparentIcon } from '@heroicons/react/24/outline'
import { ClockIcon } from '@heroicons/react/24/solid'
import { Badge, Card, Flex, Title, Text } from '@tremor/react'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import InformationPanel from '../../Components/Panels/InformationPanel'
import SpanTypeLabel from '../../Components/Span/SpanTypeLabel'
import { SearchFilterContext } from '../../Context/SearchFilterContextProvider'
import { LIST_POLLING_INTERVAL } from '../../util/polling'
import { hasAnyErrors } from '../../util/trace'

const QUERY_GET_ALL_SPANS = gql`
  query GetAllSpans($searchFilter: String) {
    spans(searchFilter: $searchFilter) {
      id
      name
      type
      brief
      statusCode
      startNano
      endNano
    }
  }
`

function SpanListComponent({ spans }: { spans: any[] }) {
  if (spans.length === 0) {
    return <InformationPanel message={{ message: 'No data to show here' }} />
  }

  return (
    <>
      {spans.map((row: any) => {
        return (
          <Card
            className="min-w-full max-w-full mb-2 flex flex-row gap-3 hover:bg-gray-50 transition-colors duration-75 ease-in-out"
            key={row.id}
          >
            <Link
              to={`/explorer/span/${row.id}`}
              className="flex-1 flex-col items-start min-w-0"
            >
              <Flex>
                <Title className="flex-1 truncate">{row.name}</Title>
                <Badge
                  size="lg"
                  className="px-3.5 py-0.5"
                  color={hasAnyErrors([row]) ? 'red' : 'green'}
                >
                  {hasAnyErrors([row]) ? 'Error' : 'Ok/Unset'}
                </Badge>
              </Flex>
              <Flex className="border-b border-gray-200 pb-2 mb-2">
                <Text>{row.id}</Text>
                {row.brief && (
                  <Text className="truncate ml-2 pl-2 flex-1 border-l border-gray-200">
                    {row.brief}
                  </Text>
                )}
              </Flex>
              <Flex className="justify-start">
                <SpanTypeLabel type={row.type} />
              </Flex>
              <Flex className="justify-end mt-2">
                <ClockIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                <Text>
                  {new Date(
                    parseInt(row.startNano.slice(0, -6), 10)
                  ).toLocaleString()}
                  , duration{' '}
                  {(BigInt(row.endNano) - BigInt(row.startNano))
                    .toString(10)
                    .slice(0, -6)}
                  ms
                </Text>
              </Flex>
            </Link>
            <Link
              to={`/explorer/map/${row.id}`}
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

export default function SpanList() {
  const [{ spansFilter: searchFilter }] = useContext(SearchFilterContext)

  const { loading, error, data } = useQuery(QUERY_GET_ALL_SPANS, {
    pollInterval: LIST_POLLING_INTERVAL,
    variables: {
      searchFilter,
    },
  })

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md flex justify-between">
            <div>OpenTelemetry Spans</div>
            <div>{data?.spans?.length && `(${data.spans.length})`}</div>
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
          <SpanListComponent spans={data.spans} />
        )}
      </div>
    </div>
  )
}
