import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { Link } from 'react-router-dom'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import SpanTypeLabel from '../../Components/Span/SpanTypeLabel'

const QUERY_GET_ALL_SPANS = gql`
  query GetAllTraces {
    spans {
      id
      name
      type
      descendantFeatures {
        id
        type
      }
    }
  }
`

export default function SpanList() {
  const { loading, error, data } = useQuery(QUERY_GET_ALL_SPANS, {
    pollInterval: 5_000,
  })

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

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      {/* Header  */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md">
            OpenTelemetry Spans
          </h1>
        </div>
      </div>

      {/* List */}
      <div className="mt-2">
        {data.spans.map((row: any) => {
          return (
            <div
              key={row.id}
              className="overflow-hidden bg-white shadow rounded-md mb-2 border border-white hover:border-gray-400"
            >
              <Link
                to={`/explorer/span/${row.id}`}
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{row.name}</span>
                      <span className="ml-2 flex flex-shrink-0">
                        <SpanTypeLabel type={row.type} />
                      </span>
                    </div>
                    <div className="font-mono text-sm text-gray-500">
                      {row.id}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex md:flex-row flex-col">
                      {/* <CustomIcons
                        customs={[
                          {
                            value: `${row.spans.length} spans`,
                            icon: HashtagIcon,
                            colour: 'text-gray-500',
                          },
                        ].filter(Boolean)}
                      /> */}
                    </div>
                    <div className="flex md:flex-row flex-col">
                      {/* <FeatureIcons
                        featureNames={row.features.map((f: any) => f.name)}
                      /> */}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-2 justify-end">
                    <div className="flex items-center text-sm text-gray-500 ml-auto">
                      {/* <ClockIcon
                        className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      <p>
                        {new Date(
                          parseInt(traceStart(row.spans).slice(0, -6), 10)
                        ).toLocaleString()}
                        , duration {traceDuration(row.spans).slice(0, -6)}ms
                      </p> */}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
