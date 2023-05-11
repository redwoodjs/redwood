import React from 'react'

import { LinkIcon } from '@heroicons/react/20/solid'
import { Link } from 'react-router-dom'

const getSpanKindName = (kind: string | number) => {
  switch (kind.toString()) {
    case '0':
      return 'Internal'
    case '1':
      return 'Server'
    case '2':
      return 'Client'
    case '3':
      return 'Producer'
    case '4':
      return 'Consumer'
    default:
      return <span className="italic">Unknown: {kind}</span>
  }
}

const getSpanStatusCodeName = (code: string | number) => {
  switch (code.toString()) {
    case '0':
      return 'Unset'
    case '1':
      return 'Ok'
    case '2':
      return 'Error'
    default:
      return <span className="italic">Unknown: {code}</span>
  }
}

export default function SpanDetails({ span }: { span: any }) {
  const data = [
    {
      name: 'Span ID',
      value: span.id,
    },
    {
      name: 'Trace ID',
      value: (
        <div className="flex flex-row">
          <Link to={`/explorer/trace/${span.trace}`} className="pr-2">
            <LinkIcon className="h-5 w-5 text-cyan-400" />
          </Link>
          <span>{span.trace}</span>
        </div>
      ),
    },
    {
      name: 'Parent ID',
      value: span.parent ? (
        span.parent
      ) : (
        <span className="italic">No parent</span>
      ),
    },
    {
      name: 'Name',
      value: span.name,
    },
    {
      name: 'Kind',
      value: getSpanKindName(span.kind),
    },
    {
      name: 'Status Code',
      value: getSpanStatusCodeName(span.statusCode),
    },
    {
      name: 'Status Message',
      value: span.statusMessage ? (
        span.statusMessage
      ) : (
        <span className="italic">No message</span>
      ),
    },
    {
      name: 'Start (ns)',
      value: span.startNano,
    },
    {
      name: 'End (ns)',
      value: span.endNano,
    },
    {
      name: 'Duration (ns)',
      value: span.durationNano,
    },
  ]

  return (
    <>
      <div>
        <div className="px-4 sm:px-0">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Span Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 border-b border-gray-200 pb-3">
            All the metadata associated with the span.
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle ">
            <table className="min-w-full divide-y divide-gray-300 border-b border-gray-200">
              <tbody className="divide-y divide-gray-200">
                {data.map((d) => (
                  <tr key={d.name}>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {d.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                      {d.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
