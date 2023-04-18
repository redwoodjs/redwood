import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { ClockIcon } from '@heroicons/react/20/solid'
import { CubeTransparentIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import InformationPanel from '../../Components/Panels/InformationPanel'
import WarningPanel from '../../Components/Panels/WarningPanel'
import SpanTypeLabel from '../../Components/Span/SpanTypeLabel'
import { LIST_POLLING_INTERVAL } from '../../util/polling'
import {
  getTraceName,
  hasAnyErrors,
  traceDuration,
  traceStart,
} from '../../util/trace'

const QUERY_GET_ALL_TRACES = gql`
  query GetAllTraces {
    rows: traces {
      id
      spans {
        id
        type
        startNano
      }
    }
  }
`

function TraceListComponent({ traces }: { traces: any[] }) {
  if (traces.length === 0) {
    return <InformationPanel message={{ message: 'No data to show here' }} />
  }

  return (
    <>
      {traces?.map((row: any) => {
        const countOfType = row.spans.reduce((acc: any, span: any) => {
          const type = span.type
          acc[type] = acc[type] ? acc[type] + 1 : 1
          return acc
        }, {})

        return (
          <div
            key={row.id}
            className="overflow-hidden bg-white shadow rounded-md mb-2 border border-white hover:border-gray-400 hover:bg-gray-50 flex flex-row justify-between"
          >
            <div className="flex flex-grow px-4 py-4 sm:px-6">
              <Link to={`/explorer/trace/${row.id}`} className="min-w-full">
                <div className="flex flex-col gap-0 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">
                      {getTraceName(row.spans)}
                    </span>
                    <span className="ml-2 flex flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${
                          hasAnyErrors(row.spans)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {hasAnyErrors(row.spans) ? 'Error' : 'Ok/Unset'}
                      </span>
                    </span>
                  </div>
                  <div className="font-mono text-sm text-gray-500">
                    {row.id}
                  </div>
                </div>
                <div className="mt-2 flex flex-row flex-wrap gap-2">
                  {Object.keys(countOfType)
                    .sort()
                    .map((type: string) => (
                      <SpanTypeLabel
                        key={type}
                        type={type}
                        count={countOfType[type]}
                      />
                    ))}
                </div>
                <div className="mt-2 flex flex-col gap-2 justify-end">
                  <div className="flex items-center text-sm text-gray-500 ml-auto">
                    <ClockIcon
                      className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <p>
                      {new Date(
                        parseInt(traceStart(row.spans).slice(0, -6), 10)
                      ).toLocaleString()}
                      , duration {traceDuration(row.spans).slice(0, -6)}ms
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <Link
              to={`/explorer/trace-tree/${row.id}`}
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

export default function TraceList() {
  const { loading, error, data } = useQuery(QUERY_GET_ALL_TRACES, {
    pollInterval: LIST_POLLING_INTERVAL,
  })

  const sortedTraces = data?.rows?.sort((a: any, b: any) => {
    const bigIntMin = (...args: bigint[]) =>
      args.reduce((m, e) => (e < m ? e : m))

    const aStart = bigIntMin(...a.spans.map((span: any) => span.startNano))
    const bStart = bigIntMin(...b.spans.map((span: any) => span.startNano))
    return aStart > bStart ? -1 : bStart > aStart ? 1 : 0
  })

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md">
            OpenTelemetry Traces
          </h1>
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
          <TraceListComponent traces={sortedTraces} />
        )}
      </div>
    </div>
  )
}
