import React from 'react'

import { Title, Grid, Col } from '@tremor/react'

import SpanTypeTimeSeriesBarChart from '../Charts/SpanTypeTimeSeriesBarChart'
import SpanTypeTimeSeriesChart from '../Charts/SpanTypeTimeSeriesChart'

export default function App() {
  return (
    <div className="bg-slate-50 p-6 h-full">
      <Title className="mb-4">Performance</Title>
      <Grid numItems={1} numItemsSm={2} numItemsLg={2} className="gap-2">
        <Col numColSpan={1} numColSpanLg={2}>
          <SpanTypeTimeSeriesBarChart
            name="All Spans"
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
            name="All Types"
            timeLimit={60 * 2}
            showHttp={true}
            showRedwoodFunction={true}
            showRedwoodService={true}
            showSql={true}
            showPrisma={true}
            showGraphql={true}
            showGeneric={false}
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
