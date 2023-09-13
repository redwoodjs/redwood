import React, { useState } from 'react'

import { useQuery, gql } from '@apollo/client'
import {
  BarList,
  Card,
  // Color,
  Select,
  SelectItem,
  Title,
  Bold,
  Flex,
  Text,
} from '@tremor/react'

import LoadingSpinner from '../Components/LoadingSpinner'
import ErrorPanel from '../Components/Panels/ErrorPanel'
import WarningPanel from '../Components/Panels/WarningPanel'

const QUERY_GET_MODELS_ACCESSED_LIST = gql`
  query QUERY_GET_MODELS_ACCESSED_LIST($timeLimit: Int!) {
    modelsAccessedList(timeLimit: $timeLimit) {
      model
      model_count
    }
  }
`

export default function ModelsAccessedList({
  name = 'Models Accessed List',
  timeLimit,
}: {
  name: string
  timeLimit: number
}) {
  const [refreshSecondsAgo, setRefreshSecondsAgo] = useState(timeLimit)

  const { loading, error, data } = useQuery(QUERY_GET_MODELS_ACCESSED_LIST, {
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

  const barListData = data.modelsAccessedList.map((item: any) => ({
    name: item.model,
    value: item.model_count,
    href: '',
    icon: '',
  }))

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
      <Flex className="mt-4">
        <Text>
          <Bold>Model</Bold>
        </Text>
        <Text>
          <Bold>Count</Bold>
        </Text>
      </Flex>
      <BarList data={barListData} className="mt-2" />
    </Card>
  )
}
