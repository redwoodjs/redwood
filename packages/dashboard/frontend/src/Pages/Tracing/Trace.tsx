import React, { useState, Fragment } from 'react'

import { useQuery, gql } from '@apollo/client'
import { Listbox, Transition } from '@headlessui/react'
import {
  CircleStackIcon,
  CodeBracketIcon,
  ClockIcon,
} from '@heroicons/react/20/solid'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { XCircleIcon } from '@heroicons/react/20/solid'
import prettyMilliseconds from 'pretty-ms'
import { useParams } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import FlameTableView from '../../Components/Tracing/FlameTableView'
import PrismaQueryView from '../../Components/Tracing/PrismaQueryView'
import TimelineView from '../../Components/Tracing/TimelineView'

const GET_TRACE_SPANS = gql`
  query GetTraceSpans($id: String!) {
    trace(id: $id) {
      id
      spans {
        id
        name
        parent
        kind
        statusCode
        statusMessage
        startNano
        endNano
        durationNano
        events
        attributes
        resources
      }
      enhancements {
        features
      }
    }
    prismaQueries(id: $id) {
      id
      trace
      parent_id
      parent_trace
      name
      method
      model
      prisma_name
      start_nano
      end_nano
      duration_nano
      duration_ms
      duration_sec
      db_statement
    }
    authProvider
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

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

interface VisualisationMode {
  name: string
}

const visualisationModes: VisualisationMode[] = [
  { name: 'Timeline' },
  { name: 'Flame Table' },
  { name: 'Prisma Queries' },
]

function Trace() {
  const { traceId } = useParams()
  const { loading, error, data } = useQuery(GET_TRACE_SPANS, {
    variables: { id: traceId },
  })

  const [visualisationMode, setVisualisationMode] = useState<VisualisationMode>(
    () => {
      return visualisationModes[0]
    }
  )

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

  if (data.trace.spans.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full gap-2">
        <div className="text-4xl">😔</div>
        <div className="text-xl">
          No spans found for trace: <span className="italic">{traceId}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight font-mono">
            {data.trace.id}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <ClockIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {prettyMilliseconds(
                Number(
                  BigInt(endSpan(data.trace.spans).endNano) -
                    BigInt(startSpan(data.trace.spans).startNano)
                ) / 1e6,
                {
                  millisecondsDecimalDigits: 2,
                  keepDecimalsOnWholeSeconds: true,
                }
              )}
              {' duration, starting '}
              {prettyMilliseconds(
                Date.now() -
                  Number(BigInt(startSpan(data.trace.spans).startNano)) / 1e6,
                {
                  compact: true,
                }
              )}
              {' ago at '}
              {new Date(
                Number(BigInt(startSpan(data.trace.spans).startNano)) / 1e6
              ).toISOString()}
            </div>
          </div>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            {data.trace.enhancements.features.includes('sql') && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <CircleStackIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                SQL
              </div>
            )}
            {data.trace.enhancements.features.includes('service_function') && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <CodeBracketIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                Service Function
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Listbox value={visualisationMode} onChange={setVisualisationMode}>
          {({ open }) => (
            <>
              <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
                Visualisation
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                  <span className="block truncate">
                    {visualisationMode.name}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {visualisationModes.map((mode) => (
                      <Listbox.Option
                        key={mode.name}
                        className={({ active }) =>
                          classNames(
                            active
                              ? 'bg-green-600 text-white'
                              : 'text-gray-900',
                            'relative cursor-default select-none py-2 pl-3 pr-9'
                          )
                        }
                        value={mode}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={classNames(
                                selected ? 'font-semibold' : 'font-normal',
                                'block truncate'
                              )}
                            >
                              {mode.name}
                            </span>

                            {selected ? (
                              <span
                                className={classNames(
                                  active ? 'text-white' : 'text-green-600',
                                  'absolute inset-y-0 right-0 flex items-center pr-4'
                                )}
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      </div>

      <div className="mt-6">
        {visualisationMode.name === 'Timeline' && (
          <TimelineView trace={data?.trace} />
        )}
        {visualisationMode.name === 'Flame Table' && (
          <FlameTableView trace={data?.trace} />
        )}
        {visualisationMode.name === 'Prisma Queries' && (
          <PrismaQueryView prismaQueries={data?.prismaQueries} />
        )}
      </div>
    </div>
  )
}

export default Trace
