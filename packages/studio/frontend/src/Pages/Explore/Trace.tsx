import React, { useState, Fragment } from 'react'

import { useQuery, gql } from '@apollo/client'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { useParams } from 'react-router-dom'

import TraceFeatureList from '../../Components/Feature/TraceFeatureList'
import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import WarningPanel from '../../Components/Panels/WarningPanel'
import TraceDetails from '../../Components/Trace/TraceDetails'
import FlameTableView from '../../Components/Tracing/FlameTableView'
import TimelineView from '../../Components/Tracing/TimelineView'
import { ITEM_POLLING_INTERVAL } from '../../util/polling'
import { classNames } from '../../util/ui'

const GET_TRACE_SPANS = gql`
  query GetTraceSpans($id: String!) {
    trace(traceId: $id) {
      id
      spans {
        id
        type
        name
        brief
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
    }
  }
`

interface VisualisationMode {
  name: string
}

const visualisationModes: VisualisationMode[] = [
  { name: 'Timeline' },
  { name: 'Flame Table' },
  // { name: 'Prisma Queries' }, // TODO: Fix this or offer some other prisma view
]

export default function Trace() {
  const { traceId } = useParams()
  const { loading, error, data } = useQuery(GET_TRACE_SPANS, {
    variables: { id: traceId },
    pollInterval: ITEM_POLLING_INTERVAL,
  })

  const [visualisationMode, setVisualisationMode] = useState<VisualisationMode>(
    () => {
      return visualisationModes[0]
    }
  )

  if (error) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <ErrorPanel error={error} />
      </div>
    )
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
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <WarningPanel
          warning={{
            traceId: traceId,
            message: `Unable to find any data for this trace.`,
          }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md flex justify-between">
            <div>OpenTelemetry Trace</div>
            <div>({traceId})</div>
          </div>
        </div>
      </div>

      {/* Trace Viewer */}
      <div className="flex flex-col gap-2 min-w-full mt-4">
        <Listbox value={visualisationMode} onChange={setVisualisationMode}>
          {({ open }) => (
            <>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6">
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
                              ? 'bg-rich-black text-white'
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
                                  active ? 'text-white' : 'text-slate-600',
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
        <div className="bg-white shadow overflow-hidden rounded-md px-1 py-1 sm:p-3 max-h-screen overflow-y-auto">
          {visualisationMode.name === 'Timeline' && (
            <TimelineView trace={data.trace} />
          )}
          {visualisationMode.name === 'Flame Table' && (
            <FlameTableView trace={data.trace} />
          )}
          {/* {visualisationMode.name === 'Prisma Queries' && (
                <PrismaQueryView prismaQueries={data.prismaQueries} />
              )} */}
        </div>
      </div>

      {/* Trace Details */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <TraceDetails trace={data.trace} />
        <TraceFeatureList
          features={data.trace.spans
            .filter((span: any) => span.type !== null)
            .map((span: any) => ({
              id: span.id,
              type: span.type,
              brief: span.brief,
              statusCode: span.statusCode,
            }))}
        />
      </div>
    </div>
  )
}
