import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { CheckIcon, HandThumbUpIcon, UserIcon } from '@heroicons/react/20/solid'
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

const timeline = [
  {
    id: 1,
    content: 'Applied to',
    target: 'Front End Developer',
    href: '#',
    date: 'Sep 20',
    datetime: '2020-09-20',
    icon: UserIcon,
    iconBackground: 'bg-gray-400',
  },
  {
    id: 2,
    content: 'Advanced to phone screening by',
    target: 'Bethany Blake',
    href: '#',
    date: 'Sep 22',
    datetime: '2020-09-22',
    icon: HandThumbUpIcon,
    iconBackground: 'bg-blue-500',
  },
  {
    id: 3,
    content: 'Completed phone screening with',
    target: 'Martha Gardner',
    href: '#',
    date: 'Sep 28',
    datetime: '2020-09-28',
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
  {
    id: 4,
    content: 'Advanced to interview by',
    target: 'Bethany Blake',
    href: '#',
    date: 'Sep 30',
    datetime: '2020-09-30',
    icon: HandThumbUpIcon,
    iconBackground: 'bg-blue-500',
  },
  {
    id: 5,
    content: 'Completed interview with',
    target: 'Katherine Snyder',
    href: '#',
    date: 'Oct 4',
    datetime: '2020-10-04',
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
]

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

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

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Latest Events
          </h3>

          <div className="flow-root mt-5">
            <ul role="list" className="-mb-8">
              {timeline.map((event, eventIdx) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {eventIdx !== timeline.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={classNames(
                            event.iconBackground,
                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white'
                          )}
                        >
                          <event.icon
                            className="h-5 w-5 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500">
                            {event.content}{' '}
                            <a
                              href={event.href}
                              className="font-medium text-gray-900"
                            >
                              {event.target}
                            </a>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={event.datetime}>{event.date}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Latest Errors
          </h3>

          <div className="flow-root mt-5">
            <ul role="list" className="-mb-8">
              {timeline.map((event, eventIdx) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {eventIdx !== timeline.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={classNames(
                            event.iconBackground,
                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white'
                          )}
                        >
                          <event.icon
                            className="h-5 w-5 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500">
                            {event.content}{' '}
                            <a
                              href={event.href}
                              className="font-medium text-gray-900"
                            >
                              {event.target}
                            </a>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={event.datetime}>{event.date}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
