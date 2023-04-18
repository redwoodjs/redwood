import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { XCircleIcon } from '@heroicons/react/20/solid'
import { ClockIcon } from '@heroicons/react/20/solid'
import prettyMilliseconds from 'pretty-ms'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import EnhancementList from '../../Components/Tracing/EnhancementList'

const QUERY_GET_ALL_TRACES = gql`
  query GetAllTraces {
    traces {
      id
      spans {
        id
        parent
        name
        kind
        statusCode # TODO: Give an indicator if an error occurred
        startNano
        endNano
      }
      enhancements {
        features
        containsError
      }
    }
  }
`

const startSpan = (spans: any[]) => {
  const startSpans = spans.sort((a: any, b: any) =>
    a.startNano > b.startNano ? 1 : b.startNano > a.startNano ? -1 : 0
  )
  if (startSpans.length === 0) {
    return startSpans[0]
  }
  return startSpans.filter((span) => span.parent === null)[0] || startSpans[0]
}

const endSpan = (spans: any[]) => {
  const endSpans = spans.sort((a: any, b: any) =>
    a.startNano > b.startNano ? -1 : b.startNano > a.startNano ? 1 : 0
  )
  if (endSpans.length === 0) {
    return endSpans[0]
  }
  return endSpans.filter((span) => span.parent === null)[0] || endSpans[0]
}

function Tracing() {
  const { loading, error, data } = useQuery(QUERY_GET_ALL_TRACES, {
    pollInterval: 1000,
  })

  if (error) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                There were an error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {JSON.stringify(error)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const startSpans = new Map()
  data.traces.forEach((trace: any) => {
    startSpans.set(trace.id, startSpan(trace.spans))
  })
  const endSpans = new Map()
  data.traces.forEach((trace: any) => {
    endSpans.set(trace.id, endSpan(trace.spans))
  })

  const sortedTraces = data.traces.sort((a: any, b: any) =>
    startSpans.get(a.id).startNano > startSpans.get(b.id).startNano
      ? -1
      : startSpans.get(b.id).startNano > startSpans.get(a.id).startNano
      ? 1
      : 0
  )

  return (
    <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {sortedTraces.map((trace: any) => (
            <li key={trace.id}>
              <Link
                to={`/tracing/${trace.id}`}
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium font-mono">
                      ID: {trace.id} | {startSpans.get(trace.id).name}
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <p
                        className={`inline-flex rounded-full bg-emerald-100 px-2 text-xs font-semibold leading-5 text-${
                          trace.enhancements.containsError ? 'red' : 'emerald'
                        }-800`}
                      >
                        {trace.enhancements.containsError
                          ? 'Error'
                          : 'Successful'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <EnhancementList
                      enhancementFeatures={trace.enhancements.features}
                    ></EnhancementList>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <ClockIcon
                        className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      {prettyMilliseconds(
                        Number(
                          BigInt(endSpan(trace.spans).endNano) -
                            BigInt(startSpan(trace.spans).startNano)
                        ) / 1e6,
                        {
                          millisecondsDecimalDigits: 2,
                          keepDecimalsOnWholeSeconds: true,
                        }
                      )}
                      {', '}
                      {prettyMilliseconds(
                        Date.now() -
                          Number(BigInt(startSpan(trace.spans).startNano)) /
                            1e6,
                        {
                          compact: true,
                        }
                      )}{' '}
                      ago
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Tracing
