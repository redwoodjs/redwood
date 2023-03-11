import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { XCircleIcon } from '@heroicons/react/20/solid'
import {
  ClockIcon,
  CircleStackIcon,
  CodeBracketIcon,
  UsersIcon,
} from '@heroicons/react/20/solid'
import prettyMilliseconds from 'pretty-ms'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'

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
                      ID: {trace.id}
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <p
                        className={`inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-${
                          trace.statusCode === 0 ||
                          trace.statusCode === undefined
                            ? 'green'
                            : 'red'
                        }-800`}
                      >
                        {trace.statusCode === 0 ||
                        trace.statusCode === undefined
                          ? 'Successful'
                          : 'Error'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 pr-2">
                        <UsersIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        Auth
                      </p>
                      <p className="flex items-center text-sm text-gray-500 pr-2">
                        <CircleStackIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        SQL
                      </p>
                      <p className="flex items-center text-sm text-gray-500 pr-2">
                        <CodeBracketIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        Service Function
                      </p>
                    </div>
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

      {/* <div className="flex flex-col gap-2">
        {sortedTraces.length > 0 ? (
          sortedTraces.map((trace: any) => {
            return (
              <Link
                to={`/tracing/${trace.id}`}
                key={trace.id}
                className="border border-gray-400 flex w-full flex-row"
              >
                <div className="flex border-r border-gray-400 p-2 min-w-[100px]">
                  <span className="w-full text-right">
                    {`${trace.spans.length} Span${
                      trace.spans.length > 1 ? 's' : ''
                    }`}
                  </span>
                </div>
                <div className="flex grow p-2 justify-evenly">
                  <span>{startSpan(trace.spans).name}</span>
                  <span>
                    Start:{' '}
                    {prettyMilliseconds(
                      Date.now() -
                        Number(BigInt(startSpan(trace.spans).startNano)) / 1e6,
                      {
                        compact: true,
                      }
                    )}{' '}
                    ago
                  </span>
                  <span>
                    Duration:{' '}
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
                  </span>
                </div>
                <div className="flex italic text-right p-2 border-l border-gray-400">
                  {trace.id}
                </div>
              </Link>
            )
          })
        ) : (
          <div className="border border-gray-400 flex w-full p-2">
            No traces yet
          </div>
        )}
      </div> */}
    </div>
  )
}

export default Tracing
