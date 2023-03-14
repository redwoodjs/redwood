import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { XCircleIcon } from '@heroicons/react/20/solid'
import { EllipsisHorizontalIcon, LinkIcon } from '@heroicons/react/20/solid'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../Components/LoadingSpinner'

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const QUERY_GET_ALL_SQL_SPANS = gql`
  query GetAllSQLSpans {
    sqlSpans {
      id
      trace
      startNano
      durationNano
      attributes
    }
  }
`

function SQL() {
  const { loading, error, data } = useQuery(QUERY_GET_ALL_SQL_SPANS, {
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

  return (
    <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900">
              SQL Statements
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              A livestream of all the SQL queries that have been executed,
              enriched with insights we think you&apos;ll find useful.
            </p>
          </div>
        </div>
        <div className="mt-4 flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
                    >
                      Trace
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Start
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Duration (ms)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Insights
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 pr-4 sm:pr-6 lg:pr-8"
                    >
                      SQL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.sqlSpans.map((span: any) => (
                    <tr key={span.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 font-mono sm:pl-6 lg:pl-8">
                        <Link to={`/tracing/${span.trace}`}>
                          <LinkIcon
                            className="mr-1.5 h-5 w-5 flex-shrink-0 text-green-400"
                            aria-hidden="true"
                          />
                        </Link>
                      </td>
                      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                        {new Date(
                          Number(BigInt(span.startNano) / BigInt(1e6))
                        ).toISOString()}
                      </td>
                      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                        {numberFormatter.format(
                          parseInt(span.durationNano) / 1e6
                        )}
                      </td>
                      <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                        <EllipsisHorizontalIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                      </td>
                      <td className="whitespace-pre-wrap py-4 px-3 text-sm text-gray-500 flex-wrap sm:pr-6 lg:pr-8">
                        {JSON.parse(span.attributes)['db.statement']}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SQL
