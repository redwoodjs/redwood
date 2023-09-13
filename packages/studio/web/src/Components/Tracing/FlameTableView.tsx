import React from 'react'

// See https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2
const percentile = (numbers: number[], percentile: number): number => {
  if (numbers.length === 0) {
    return 0
  }
  if (percentile <= 0) {
    return numbers[0]
  }
  if (percentile >= 1) {
    return numbers[numbers.length - 1]
  }

  const index = (numbers.length - 1) * percentile,
    lower = Math.floor(index),
    upper = lower + 1,
    weight = index % 1

  if (upper >= numbers.length) {
    return numbers[lower]
  }
  return numbers[lower] * (1 - weight) + numbers[upper] * weight
}

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

  const numberFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })

  const spanFlameData = uniqueSpanNames
    .map((spanName: string) => {
      const spansOfInterest = spanStats.filter((span) => span.name === spanName)
      const durations = (
        spansOfInterest.map((span) => span.duration) as number[]
      ).sort((a, b) => a - b)

      const sum = durations.reduce((acc, duration) => acc + duration, 0)
      const middle = Math.floor(durations.length / 2)

      return spansOfInterest.length === 1
        ? {
            name: spanName,
            count: spansOfInterest.length,
            mean: numberFormatter.format(sum / 1e6),
            min: '-',
            median: '-',
            max: '-',
            p90: '-',
            p95: '-',
            sum: '-',
          }
        : {
            name: spanName,
            count: spansOfInterest.length,
            mean: numberFormatter.format(sum / spansOfInterest.length / 1e6),
            min: numberFormatter.format(Math.min(...durations) / 1e6),
            median: numberFormatter.format(
              (durations.length % 2 === 0
                ? (durations[middle - 1] + durations[middle]) / 2
                : durations[middle]) / 1e6
            ),
            max: numberFormatter.format(Math.max(...durations) / 1e6),
            p90: numberFormatter.format(percentile(durations, 0.9) / 1e6),
            p95: numberFormatter.format(percentile(durations, 0.95) / 1e6),
            sum: numberFormatter.format(sum / 1e6),
          }
    })
    .sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
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
                Quantity
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                Mean (ms)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                Min (ms)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                Median (ms)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                Max (ms)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                p(90) (ms)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                p(95) (ms)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 pr-4 sm:pr-6 lg:pr-8"
              >
                Sum (ms)
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
                    {row.mean}
                  </td>
                  <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {row.min}
                  </td>
                  <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {row.median}
                  </td>
                  <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {row.max}
                  </td>
                  <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {row.p90}
                  </td>
                  <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {row.p95}
                  </td>
                  <td className="whitespace-pre-wrap py-4 px-3 text-sm text-gray-500 flex-wrap sm:pr-6 lg:pr-8 text-right">
                    {row.sum}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FlameTableView
