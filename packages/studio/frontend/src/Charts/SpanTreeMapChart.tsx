import React from 'react'

import { ResponsiveTreeMap } from '@nivo/treemap'
import { useNavigate } from 'react-router-dom'

export default function SpanTreeMapChart({ data }: { data: any }) {
  const navigate = useNavigate()

  return (
    <ResponsiveTreeMap
      data={data}
      identity="name"
      value="durationMilli"
      valueFormat=".02s"
      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      labelSkipSize={12}
      labelTextColor={{
        from: 'color',
        modifiers: [['darker', 1.2]],
      }}
      parentLabelPosition="left"
      parentLabelTextColor={{
        from: 'color',
        modifiers: [['darker', 2]],
      }}
      borderColor={{
        from: 'color',
        modifiers: [['darker', 0.1]],
      }}
      onClick={(node, event) => {
        console.log(node)
        if (event.ctrlKey) {
          navigate(`/explorer/span/${node.data.id}`)
          return
        }
        navigate(`/explorer/map/${node.data.id}`)
      }}
    />
  )
}
