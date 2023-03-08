import React from 'react'

import { useQuery, gql } from '@apollo/client'
import prettyMilliseconds from 'pretty-ms'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../Components/LoadingSpinner'

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
    return <div>{JSON.stringify(error)}</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
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
    <div className="flex flex-col gap-2">
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
    </div>
  )
}

export default Tracing
