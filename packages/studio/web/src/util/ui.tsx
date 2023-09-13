import React from 'react'

import { Text } from '@tremor/react'

export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export function displayTextOrJSON(value: any) {
  try {
    return <pre>{JSON.stringify(JSON.parse(value), undefined, 2)}</pre>
  } catch (error) {
    return <Text>{value}</Text>
  }
}
