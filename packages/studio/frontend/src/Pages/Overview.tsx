import React from 'react'

import { Title, Grid, Col } from '@tremor/react'

import SeriesTypeBarList from '../BarLists/SeriesTypeBarList'

export default function App() {
  return (
    <div className="p-6 h-full">
      <Title className="mb-4">RedwoodJS Studio</Title>
      <Grid numCols={1} numColsSm={2} numColsLg={2} className="gap-2">
        <Col numColSpan={1} numColSpanLg={2}>
          <SeriesTypeBarList
            name="Recent Spans Counts"
            timeLimit={2 * 60}
          ></SeriesTypeBarList>
        </Col>
      </Grid>
    </div>
  )
}
