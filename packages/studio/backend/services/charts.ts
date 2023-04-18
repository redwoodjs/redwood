import { getDatabase } from '../database'

export async function spanTypeTimeline(
  _parent: unknown,
  {
    timeLimit,
    timeBucket,
  }: {
    timeLimit: number
    timeBucket: number
  }
) {
  const db = await getDatabase()
  const stmt = await db.prepare(
    `
    SELECT *, FLOOR(start_nano / 1000000) AS start_milli FROM span
    WHERE start_nano >= ?;
    `
  )
  const result = await stmt.all(Date.now() - timeLimit * 1e9)
  await stmt.finalize()

  const data: any[] = []

  const typesWithStartMilli = result.map((span) => ({
    type: span.type,
    start_milli: span.start_milli,
  }))
  const types = [
    ...new Set(
      typesWithStartMilli.map((span) =>
        span.type === null ? 'generic' : span.type
      )
    ),
  ]

  const steps = Math.floor(timeLimit / timeBucket)
  const now = Date.now()
  for (let i = 0; i < steps; i++) {
    const ago = (i + 1) * timeBucket
    const windowStart = now - ago * 1e3
    const windowEnd = windowStart + timeBucket * 1e3
    const bucketSpans = typesWithStartMilli.filter(
      (span) => span.start_milli >= windowStart && span.start_milli < windowEnd
    )
    const bucketSpansCount = types.reduce((acc, type) => {
      acc[type] = bucketSpans.filter((span) => span.type === type).length
      return acc
    }, {} as Record<string, number>)
    data.push({
      ago: (i + 1) * timeBucket,
      ...bucketSpansCount,
    })
  }
  data.forEach((d) => {
    types.map((t) => {
      d[`${t}Color`] = 'hsl(176, 70%, 50%)'
    })
  })

  const keys = types
  const index = 'ago'
  const legend = {
    dataFrom: 'keys',
    anchor: 'bottom-right',
    direction: 'column',
    justify: false,
    translateX: 120,
    translateY: 0,
    itemsSpacing: 2,
    itemWidth: 100,
    itemHeight: 20,
    itemDirection: 'left-to-right',
    itemOpacity: 0.85,
    symbolSize: 20,
    effects: [
      {
        on: 'hover',
        style: {
          itemOpacity: 1,
        },
      },
    ],
  }
  const axisLeft = {
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Count',
    legendPosition: 'middle',
    legendOffset: -40,
  }
  const axisBottom = {
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Seconds Ago',
    legendPosition: 'middle',
    legendOffset: 32,
  }

  return {
    data,
    keys,
    index,
    legend,
    axisLeft,
    axisBottom,
  }
}
