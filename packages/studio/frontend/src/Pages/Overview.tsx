import React from 'react'

import { Title, Grid, Col } from '@tremor/react'

import SeriesTypeBarList from '../BarLists/SeriesTypeBarList'

export default function App() {
  return (
    <div className="bg-slate-50 p-6 sm:p-10 h-full">
      <Title className="mb-4">RedwoodJS Studio</Title>
      <Grid numCols={1} numColsSm={2} numColsLg={2} className="gap-2">
        <Col numColSpan={1} numColSpanLg={2}>
          <SeriesTypeBarList
            name="Types"
            timeLimit={2 * 60}
          ></SeriesTypeBarList>
        </Col>
      </Grid>
    </div>
  )
}
