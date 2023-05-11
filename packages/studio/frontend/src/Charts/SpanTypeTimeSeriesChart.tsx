import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { Color, Card, LineChart, Title } from '@tremor/react'

import LoadingSpinner from '../Components/LoadingSpinner'
import ErrorPanel from '../Components/Panels/ErrorPanel'
import WarningPanel from '../Components/Panels/WarningPanel'

const QUERY_GET_SPAN_TYPE_TIMESERIES = gql`
  query QUERY_GET_SPAN_TYPE_TIMESERIES(
    $timeLimit: Int!
    $showGeneric: Boolean!
    $showGraphql: Boolean!
    $showHttp: Boolean!
    $showPrisma: Boolean!
    $showRedwoodFunction: Boolean!
    $showRedwoodService: Boolean!
    $showSql: Boolean!
  ) {
    spanTypeTimeSeriesData(timeLimit: $timeLimit) {
      generic @include(if: $showGeneric)
      graphql @include(if: $showGraphql)
      http @include(if: $showHttp)
      prisma @include(if: $showPrisma)
      redwoodfunction @include(if: $showRedwoodFunction)
      redwoodservice @include(if: $showRedwoodService)
      sql @include(if: $showSql)
      ts
    }
  }
`

export default function SpanTypeTimeSeriesChart({
  name = 'Time Series Chart',
  timeLimit,
  showGeneric = false,
  showGraphql = false,
  showHttp = false,
  showPrisma = false,
  showRedwoodFunction = false,
  showRedwoodService = false,
  showSql = false,
}: {
  name: string
  timeLimit: number
  showGeneric?: boolean
  showGraphql?: boolean
  showHttp?: boolean
  showPrisma?: boolean
  showRedwoodFunction?: boolean
  showRedwoodService?: boolean
  showSql?: boolean
}) {
  const { loading, error, data } = useQuery(QUERY_GET_SPAN_TYPE_TIMESERIES, {
    variables: {
      timeLimit,
      showGeneric,
      showGraphql,
      showHttp,
      showPrisma,
      showRedwoodFunction,
      showRedwoodService,
      showSql,
    },
    pollInterval: 5_000,
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

  const categories = []
  const colors = [] as Color[]

  if (showGeneric) {
    categories.push('generic')
    colors.push('amber')
  }
  if (showGraphql) {
    categories.push('graphql')
    colors.push('pink')
  }
  if (showHttp) {
    categories.push('http')
    colors.push('emerald')
  }
  if (showPrisma) {
    categories.push('prisma')
    colors.push('lime')
  }
  if (showRedwoodFunction) {
    categories.push('redwoodfunction')
    colors.push('blue')
  }
  if (showRedwoodService) {
    categories.push('redwoodservice')
    colors.push('rose')
  }
  if (showSql) {
    categories.push('sql')
    colors.push('purple')
  }

  return (
    <Card>
      <Title>{name}</Title>
      <LineChart
        className="mt-6"
        data={data.spanTypeTimeSeriesData}
        index="ts"
        categories={categories}
        colors={colors}
        // valueFormatter={dataFormatter}
        yAxisWidth={40}
        connectNulls={true}
        showAnimation={false}
      />
    </Card>
  )
}
