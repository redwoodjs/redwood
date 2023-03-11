import React from 'react'

import { useQuery, gql } from '@apollo/client'
import {
  CircleStackIcon,
  CodeBracketIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'

import LoadingSpinner from '../Components/LoadingSpinner'

const QUERY_SQL_COUNT = gql`
  query GetSQLCount {
    sqlCount
  }
`

const QUERY_TRACE_COUNT = gql`
  query GetTraceCount {
    traceCount
  }
`

function App() {
  const {
    loading: countSQLLoading,
    error: countSQLError,
    data: countSQLData,
  } = useQuery(QUERY_SQL_COUNT, {
    pollInterval: 1000,
  })

  const {
    loading: countTraceLoading,
    error: countTraceError,
    data: countTraceData,
  } = useQuery(QUERY_TRACE_COUNT, {
    pollInterval: 1000,
  })

  return (
    <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
      <div>
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Development Session
        </h3>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-green-500 p-3">
                <MagnifyingGlassIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                OpenTelemetry Traces
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {countTraceError ? (
                  'error'
                ) : countTraceLoading ? (
                  <LoadingSpinner />
                ) : (
                  countTraceData?.traceCount
                )}
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <NavLink
                    to="/tracing"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    {' '}
                    View all
                    <span className="sr-only"> OpenTelemetry Trace stats</span>
                  </NavLink>
                </div>
              </div>
            </dd>
          </div>
          <div className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-green-500 p-3">
                <CodeBracketIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                Service Function Calls
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                <EllipsisHorizontalIcon
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <NavLink
                    to="/coming-soon"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    {' '}
                    View all
                    <span className="sr-only">
                      {' '}
                      Service Function Calls stats
                    </span>
                  </NavLink>
                </div>
              </div>
            </dd>
          </div>
          <div className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-green-500 p-3">
                <CircleStackIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                SQL Queries
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {countSQLError ? (
                  'error'
                ) : countSQLLoading ? (
                  <LoadingSpinner />
                ) : (
                  countSQLData?.sqlCount
                )}
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <NavLink
                    to="/sql"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    {' '}
                    View all
                    <span className="sr-only"> SQL Queries stats</span>
                  </NavLink>
                </div>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export default App
