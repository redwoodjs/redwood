import React, { useState } from 'react'

import { useQuery, gql } from '@apollo/client'
import {
  Color,
  Card,
  Select,
  SelectItem,
  Flex,
  BarChart,
  Title,
} from '@tremor/react'

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

export default function SpanTypeTimeSeriesBarChart({
  name = 'Time Series Bar Chart',
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
  const [refreshSecondsAgo, setRefreshSecondsAgo] = useState(timeLimit)

  const { loading, error, data } = useQuery(QUERY_GET_SPAN_TYPE_TIMESERIES, {
    variables: {
      timeLimit: refreshSecondsAgo,
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

  const agos = [30, 60, 120, 240, 480]

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
      <Flex className="space-x-4" justifyContent="between" alignItems="stretch">
        <Title>{name}</Title>
        <Select
          onValueChange={(value) => setRefreshSecondsAgo(parseInt(value))}
          placeholder="120 seconds ago"
          className="max-w-xs w-64"
        >
          {agos.map((ago) => (
            <SelectItem
              key={`ago-${ago}`}
              value={`${ago}`}
            >{`${ago} seconds ago`}</SelectItem>
          ))}
        </Select>
      </Flex>
      <BarChart
        className="mt-6"
        data={data.spanTypeTimeSeriesData}
        index="ts"
        categories={categories}
        colors={colors}
        // valueFormatter={dataFormatter}
        yAxisWidth={48}
        showAnimation={false}
        stack={true}
        relative={true}
      />
    </Card>
  )
}
