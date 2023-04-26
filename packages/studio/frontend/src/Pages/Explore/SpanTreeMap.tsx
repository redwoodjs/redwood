import React, { useMemo, useState } from 'react'

import { useQuery, gql } from '@apollo/client'
import { Switch } from '@headlessui/react'
import { useParams } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import WarningPanel from '../../Components/Panels/WarningPanel'
import { classNames } from '../../util/ui'

const GET_TRACE_SPANS = gql`
  query GetTraceSpans($id: String!) {
    trace(traceId: $id) {
      id
      features {
        id
        brief
      }
      spans {
        id
        name
        parent
        type
        startNano
        endNano
        durationNano
      }
    }
  }
`

export default function SpanTreeMap() {
  const [genericSpansEnabled, setGenericSpansEnabled] = useState(true)

  const { traceId } = useParams()
  const { loading, error, data } = useQuery(GET_TRACE_SPANS, {
    variables: { id: traceId },
  })

  const treeData = useMemo(() => {
    const spans = genericSpansEnabled
      ? data?.trace.spans
      : data?.trace.spans.filter((span: any) => {
          return span.type != null
        })

    if (spans == null) {
      return []
    }

    const treeNodes = spans.map((span: any) => {
      return {
        id: span.id,
        parent: span.parent,
        name: span.name,
        type: span.type,
      }
    })

    return [...treeNodes]
  }, [data, genericSpansEnabled])

  if (error) {
    return <ErrorPanel error={error} />
  }

  if (loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (data.trace.spans.length === 0) {
    return (
      <WarningPanel
        warning={{
          traceId: traceId,
          message: `Unable to find any data for this trace.`,
        }}
      />
    )
  }

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md">
            Tree View
          </h1>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md mt-2 px-1 py-1 sm:p-3">
        <Switch.Group as="div" className="flex items-center">
          <Switch
            checked={genericSpansEnabled}
            onChange={setGenericSpansEnabled}
            className={classNames(
              genericSpansEnabled ? 'bg-sinopia' : 'bg-gray-200',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sinopia focus:ring-offset-2'
            )}
          >
            <span className="sr-only">Use setting</span>
            <span
              className={classNames(
                genericSpansEnabled ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none relative inline-block h-5 w-5 transform rounded-md bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            >
              <span
                className={classNames(
                  genericSpansEnabled
                    ? 'opacity-0 duration-100 ease-out'
                    : 'opacity-100 duration-200 ease-in',
                  'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                )}
                aria-hidden="true"
              >
                <svg
                  className="h-3 w-3 text-gray-400"
                  fill="none"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span
                className={classNames(
                  genericSpansEnabled
                    ? 'opacity-100 duration-200 ease-in'
                    : 'opacity-0 duration-100 ease-out',
                  'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                )}
                aria-hidden="true"
              >
                <svg
                  className="h-3 w-3 text-sinopia"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                </svg>
              </span>
            </span>
          </Switch>
          <Switch.Label as="span" className="ml-3 text-sm">
            <span className="font-medium text-gray-900">
              Include Generic Spans
            </span>
          </Switch.Label>
        </Switch.Group>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md mt-2 px-1 py-1 sm:p-3">
        <pre className="overflow-x-auto">
          {JSON.stringify(treeData, undefined, 2)}
        </pre>
      </div>

      {/* JSON Data - Temp  */}
      <div className="sm:flex text-base leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md mt-6">
        <pre className="overflow-x-auto">
          {JSON.stringify(data.trace, undefined, 2)}
        </pre>
      </div>
    </div>
  )
}
