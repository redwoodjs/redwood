import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { LineChart } from '@tremor/react'
// import { ResponsiveBar } from '@nivo/bar'

import LoadingSpinner from '../Components/LoadingSpinner'
import ErrorPanel from '../Components/Panels/ErrorPanel'
import WarningPanel from '../Components/Panels/WarningPanel'

const QUERY_GET_SPAN_TYPE_TIMESERIES = gql`
  query spanTypeTimeSeriesData($timeLimit: Int!) {
    spanTypeTimeSeriesData(timeLimit: $timeLimit) {
      generic
      graphql
      http
      prisma
      redwoodfunction
      redwoodservice
      sql
      ts
    }
  }
`

export default function SpanTypeTimeSeriesChart({
  timeLimit,
}: {
  timeLimit: number
}) {
  const { loading, error, data } = useQuery(QUERY_GET_SPAN_TYPE_TIMESERIES, {
    variables: { timeLimit },
    // pollInterval: timeBucket * 1_000,
  })

  if (error) {
    return <ErrorPanel error={error} />
  }

  if (loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center min-h-[250px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) {
    return (
      <WarningPanel
        warning={{
          message: 'No data to display',
        }}
      />
    )
  }

  return (
    <LineChart
      className="mt-6"
      data={data.spanTypeTimeSeriesData}
      index="ts"
      categories={[
        'prisma',
        'sql',
        'graphql',
        'http',
        'redwoodfunction',
        'redwoodservice',
        'generic',
      ]}
      colors={['emerald', 'orange', 'blue', 'red', 'yellow', 'purple', 'pink']}
      // valueFormatter={dataFormatter}
      yAxisWidth={40}
      connectNulls={true}
    />
  )
}
