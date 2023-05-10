import React from 'react'

import SpanTypeBarChart from '../Charts/SpanTypeBarChart'
import SpanTypeTimeSeriesChart from '../Charts/SpanTypeTimeSeriesChart'

export default function App() {
  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        {/* Header  */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-slate-100 px-4 pt-2 pb-2 bg-rich-black rounded-md">
              RedwoodJS Studio
            </h1>
          </div>
        </div>

        {/* SpanTypeTimeline Chart */}
        <div className="overflow-hidden bg-white shadow rounded-md border border-white flex flex-row justify-between">
          <SpanTypeBarChart timeLimit={60 * 2} timeBucket={5} />
        </div>
        <div className="overflow-hidden bg-white shadow rounded-md border border-white flex flex-row justify-between">
          <SpanTypeTimeSeriesChart timeLimit={60 * 2} />
        </div>
      </div>
    </div>
  )
}
