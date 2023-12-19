import { getDatabase } from '../database'

import { getDescendantSpans, getSpan } from './util'

export async function spanTypeTimeSeriesData(
  _parent: unknown,
  {
    timeLimit,
  }: {
    timeLimit: number
  }
) {
  const db = await getDatabase()
  const stmt = await db.prepare(`
  SELECT
    ts,
    json_patch (json_object('ts', ts),
      json_group_object (series_type,
        duration_msec)) AS chartdata
  FROM (
    SELECT
      datetime (start_nano / 1000000000,
        'unixepoch',
        'utc') AS ts,
      replace(coalesce(TYPE, 'generic'), '-', '') AS series_type,
      sum(duration_nano / 1000000.0) AS duration_msec
    FROM
      span
    GROUP BY
      ts,
      series_type
    ORDER BY
      start_nano ASC,
      series_type)
  WHERE
    ts >= datetime ('now', ?, 'utc')
  GROUP BY
    ts
  ORDER BY
    ts ASC;
  `)

  const result = await stmt.all(`-${timeLimit} seconds`)
  await stmt.finalize()
  const chartData = result.map((row) => JSON.parse(row['chartdata']))

  return chartData
}

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

function buildTree(objects: any[], id: string) {
  const tree: any = {}

  const root = objects.find((o) => o.id === id)
  tree.id = root.id
  tree.parent = root.parent
  tree.name = root.name
  tree.durationMilli = root.duration_nano / 1e6

  const children = objects.filter((o) => o.parent === id)
  if (children.length > 0) {
    tree.children = children.map((c) => buildTree(objects, c.id))
  }

  return tree
}

export async function spanTreeMapData(
  _parent: unknown,
  { spanId }: { spanId: string }
) {
  const rootSpan = await getSpan(spanId)
  const descendantSpans = await getDescendantSpans(spanId)
  return buildTree([...descendantSpans, rootSpan], spanId)
}
