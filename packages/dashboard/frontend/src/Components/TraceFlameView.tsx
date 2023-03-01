import React from 'react'

function TraceFlameView({ trace }: { trace: any }) {
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
    <table className="table-auto">
      <thead>
        <tr>
          <th className="text-left">Span Name</th>
          <th className="text-right">Count</th>
          <th className="text-right">Self (ms)</th>
          <th className="text-right">Total (ms)</th>
        </tr>
      </thead>
      <tbody>
        {spanFlameData
          .sort((a: any, b: any) => (a.self < b.self ? 1 : -1))
          .map((row: any) => {
            return (
              <tr key={row.name}>
                <td className="text-left">{row.name}</td>
                <td className="text-right">{row.count}</td>
                <td className="text-right">
                  {numberFormatter.format(row.self / 1e6)}
                </td>
                <td className="text-right">
                  {numberFormatter.format(row.total / 1e6)}
                </td>
              </tr>
            )
          })}
      </tbody>
    </table>
  )
}

export default TraceFlameView
