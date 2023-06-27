import React from 'react'

import { Title, Grid, Col } from '@tremor/react'

import ModelsAccessedList from '../BarLists/ModelsAccessedList'
import SeriesTypeBarList from '../BarLists/SeriesTypeBarList'

export default function App() {
  return (
    <div className="p-6 h-full">
      <Title className="mb-4">RedwoodJS Studio</Title>
      <Grid numItems={1} numItemsSm={2} numItemsLg={2} className="gap-2">
        <Col numColSpan={1}>
          <SeriesTypeBarList
            name="Recent Spans"
            timeLimit={2 * 60}
          ></SeriesTypeBarList>
        </Col>
        <Col>
          <ModelsAccessedList
            name="Models Accessed"
            timeLimit={2 * 60}
          ></ModelsAccessedList>
        </Col>
      </Grid>
    </div>
  )
}
