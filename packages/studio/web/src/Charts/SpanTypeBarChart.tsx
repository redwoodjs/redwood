import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { ResponsiveBar } from '@nivo/bar'

import LoadingSpinner from '../Components/LoadingSpinner'
import ErrorPanel from '../Components/Panels/ErrorPanel'
import WarningPanel from '../Components/Panels/WarningPanel'

const QUERY_GET_SPAN_TYPE_TIMELINE = gql`
  query GetSpanTypeTimeline($timeLimit: Int!, $timeBucket: Int!) {
    spanTypeTimeline(timeLimit: $timeLimit, timeBucket: $timeBucket) {
      data
      keys
      index
      legend
      axisLeft
      axisBottom
    }
  }
`

export default function SpanTypeBarChart({
  timeLimit,
  timeBucket,
}: {
  timeLimit: number
  timeBucket: number
}) {
  const { loading, error, data } = useQuery(QUERY_GET_SPAN_TYPE_TIMELINE, {
    variables: { timeLimit, timeBucket },
    pollInterval: timeBucket * 1_000,
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
    <div className="min-h-[250px] w-full">
      <ResponsiveBar
        data={data.spanTypeTimeline.data}
        keys={data.spanTypeTimeline.keys}
        indexBy={data.spanTypeTimeline.index}
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'nivo' }}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={data.spanTypeTimeline.axisBottom}
        axisLeft={data.spanTypeTimeline.axisLeft}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        legends={[data.spanTypeTimeline.legend]}
      />
    </div>
  )
}
