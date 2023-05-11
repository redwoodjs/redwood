import React, { useState } from 'react'

import { useQuery, gql } from '@apollo/client'
import {
  BarList,
  Card,
  // Color,
  Dropdown,
  DropdownItem,
  Title,
  Bold,
  Flex,
  Text,
} from '@tremor/react'

import LoadingSpinner from '../Components/LoadingSpinner'
import ErrorPanel from '../Components/Panels/ErrorPanel'
import WarningPanel from '../Components/Panels/WarningPanel'

const QUERY_GET_SERIES_TYPE_BAR_LIST = gql`
  query QUERY_GET_SERIES_TYPE_BAR_LIST($timeLimit: Int!) {
    seriesTypeBarList(timeLimit: $timeLimit) {
      quantity
      series_name
      series_type
    }
  }
`

export default function SeriesTypeBarList({
  name = 'Bar List',
  timeLimit,
}: {
  name: string
  timeLimit: number
}) {
  const [refreshSecondsAgo, setRefreshSecondsAgo] = useState(timeLimit)

  const { loading, error, data } = useQuery(QUERY_GET_SERIES_TYPE_BAR_LIST, {
    variables: {
      timeLimit: refreshSecondsAgo,
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

  const agos = [30, 60, 120, 240, 480]

  const barListData = data.seriesTypeBarList.map((item: any) => ({
    name: item.series_name,
    value: item.quantity,
    href: '',
    icon: function YouTubeIcon() {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2.5 fill-red-500"
          viewBox="0 0 24 24"
          width="20"
          height="20"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z" />
        </svg>
      )
    },
  }))

  return (
    <Card>
      <Flex className="space-x-4" justifyContent="start" alignItems="center">
        <Title>{name}</Title>
        <Dropdown
          onValueChange={(value) => setRefreshSecondsAgo(parseInt(value))}
          placeholder="120 seconds ago"
          className="max-w-xs"
        >
          {agos.map((ago) => (
            <DropdownItem
              key={`ago-${ago}`}
              value={`${ago}`}
              text={`${ago} seconds ago`}
            />
          ))}
        </Dropdown>
      </Flex>
      <Flex className="mt-4">
        <Text>
          <Bold>Type</Bold>
        </Text>
        <Text>
          <Bold>Quantity</Bold>
        </Text>
      </Flex>
      <BarList data={barListData} className="mt-2" />
    </Card>
  )
}
