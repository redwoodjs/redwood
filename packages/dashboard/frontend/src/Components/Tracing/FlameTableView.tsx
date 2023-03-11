import React from 'react'

function FlameTableView({ trace }: { trace: any }) {
  const spanStats: any[] = trace.spans.map((span: any) => {
    return {
      id: span.id,
      name: span.name,
      // We assume durationNano will fit into Number
      duration: Number(span.durationNano),
      parent: span.parent,
    }
  })
  const uniqueSpanNames: string[] = Array.from(
    new Set(spanStats.map((span) => span.name))
  )

  const spanFlameData = uniqueSpanNames.map((spanName: string) => {
    const spansOfInterest = spanStats.filter((span) => span.name === spanName)
    const total = spansOfInterest.reduce((acc: number, span: any) => {
      return acc + span.duration
    }, 0)

    const spanIdsWithName = spansOfInterest.map((span) => span.id)
    const childTime = spanStats.reduce((acc: number, span: any) => {
      if (spanIdsWithName.includes(span.parent)) {
        return acc + span.duration
      }
      return acc
    }, 0)

    return {
      name: spanName,
      count: spansOfInterest.length,
      total,
      self: Math.max(0, total - childTime),
    }
  })

  const numberFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Prisma Queries
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all Prisma queries executed during this trace.
          </p>
        </div>
      </div>
      <div className="mt-4 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
                  >
                    Span Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Count
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                  >
                    Self (ms)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 pr-4 sm:pr-6 lg:pr-8"
                  >
                    Total (ms)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {spanFlameData
                  .sort((a: any, b: any) => (a.self < b.self ? 1 : -1))
                  .map((row: any) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                        {row.count}
                      </td>
                      <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                        {numberFormatter.format(row.self / 1e6)}
                      </td>
                      <td className="whitespace-pre-wrap py-4 px-3 text-sm text-gray-500 flex-wrap sm:pr-6 lg:pr-8 text-right">
                        {numberFormatter.format(row.total / 1e6)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    // <table className="table-auto">
    //   <thead>
    //     <tr>
    //       <th className="text-left">Span Name</th>
    //       <th className="text-right">Count</th>
    //       <th className="text-right">Self (ms)</th>
    //       <th className="text-right">Total (ms)</th>
    //     </tr>
    //   </thead>
    //   <tbody>
    //     {spanFlameData
    //       .sort((a: any, b: any) => (a.self < b.self ? 1 : -1))
    //       .map((row: any) => {
    //         return (
    //           <tr key={row.name}>
    //             <td className="text-left">{row.name}</td>
    //             <td className="text-right">{row.count}</td>
    //             <td className="text-right">
    //               {numberFormatter.format(row.self / 1e6)}
    //             </td>
    //             <td className="text-right">
    //               {numberFormatter.format(row.total / 1e6)}
    //             </td>
    //           </tr>
    //         )
    //       })}
    //   </tbody>
    // </table>
  )
}

export default FlameTableView
