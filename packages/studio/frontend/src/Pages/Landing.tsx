import React from 'react'

import { Title, Grid, Col } from '@tremor/react'

import SpanTypeBarChart from '../Charts/SpanTypeBarChart'
import SpanTypeTimeSeriesChart from '../Charts/SpanTypeTimeSeriesChart'

export default function App() {
  return (
    <div className="bg-slate-50 p-6 sm:p-10 h-full">
      <Title>RedwoodJS Studio</Title>
      <Grid numCols={1} numColsSm={2} numColsLg={3} className="gap-2">
        <Col numColSpan={1} numColSpanLg={3}>
          <SpanTypeBarChart timeLimit={60 * 2} timeBucket={5} />
        </Col>
        <Col numColSpan={1} numColSpanLg={3}>
          <SpanTypeTimeSeriesChart
            name="All Types"
            timeLimit={60 * 2}
            showHttp={true}
            showRedwoodFunction={true}
            showRedwoodService={true}
            showSql={true}
            showPrisma={true}
            showGraphql={true}
            showGeneric={true}
          />
        </Col>
        <Col>
          <SpanTypeTimeSeriesChart
            name="Functions and Services"
            timeLimit={60 * 2}
            showHttp={true}
            showRedwoodFunction={true}
            showRedwoodService={true}
          />
        </Col>
        <Col>
          <SpanTypeTimeSeriesChart
            name="GraphQL"
            timeLimit={60 * 2}
            showGraphql={true}
          />
        </Col>
        <Col>
          <SpanTypeTimeSeriesChart
            name="Database"
            timeLimit={60 * 2}
            showPrisma={true}
            showSql={true}
          />
        </Col>
      </Grid>
    </div>
  )
}
