import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { CubeTransparentIcon } from '@heroicons/react/24/outline'
import { ClockIcon } from '@heroicons/react/24/solid'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import InformationPanel from '../../Components/Panels/InformationPanel'
import SpanTypeLabel from '../../Components/Span/SpanTypeLabel'
import { LIST_POLLING_INTERVAL } from '../../util/polling'
import { hasAnyErrors } from '../../util/trace'

const QUERY_GET_ALL_SPANS = gql`
  query GetAllTraces {
    spans {
      id
      name
      type
      brief
      statusCode
      startNano
      endNano
      # descendantSpans {
      #   id
      #   type
      # }
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
          <div
            key={row.id}
            className="overflow-hidden bg-white shadow rounded-md mb-2 border border-white hover:border-gray-400 hover:bg-gray-50 flex flex-row justify-between"
          >
            <div className="px-4 py-4 sm:px-6 flex flex-grow">
              <Link to={`/explorer/span/${row.id}`} className="min-w-full">
                <div className="flex flex-col gap-0 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{row.name}</span>
                    <span className="ml-2 flex flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${
                          hasAnyErrors([row])
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {hasAnyErrors([row]) ? 'Error' : 'Ok/Unset'}
                      </span>
                    </span>
                  </div>
                  <div className="font-mono text-sm text-gray-500">
                    {row.id}
                    {row.brief && (
                      <span className="truncate"> | {row.brief}</span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex md:flex-row flex-col">
                    <SpanTypeLabel type={row.type} />
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2 justify-end">
                  <div className="flex items-center text-sm text-gray-500 ml-auto">
                    <ClockIcon
                      className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <p>
                      {new Date(
                        parseInt(row.startNano.slice(0, -6), 10)
                      ).toLocaleString()}
                      , duration{' '}
                      {(BigInt(row.endNano) - BigInt(row.startNano))
                        .toString(10)
                        .slice(0, -6)}
                      ms
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <Link
              to={`/explorer/map/${row.id}`}
              className="flex flex-shrink-0 bg-rich-black text-white my-2 mr-2 p-2 rounded-md items-center justify-center"
            >
              <CubeTransparentIcon className="h-5 w-5" />
            </Link>
          </div>
        )
      })}
    </>
  )
}

export default function SpanList() {
  const { loading, error, data } = useQuery(QUERY_GET_ALL_SPANS, {
    pollInterval: LIST_POLLING_INTERVAL,
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
