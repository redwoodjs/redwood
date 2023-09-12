import { getDatabase } from '../database'

export async function seriesTypeBarList(
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
    TYPE AS series_type,
    CASE
      WHEN instr(brief, '/*') > 0 THEN
        substr(substr(brief, 1, instr(brief, '/*') - 1), 0, 255)
        ELSE
          brief
    END AS series_name,
    count(brief) AS quantity
  FROM
    span
  WHERE
    datetime (start_nano / 1000000000, 'unixepoch', 'utc') >= datetime ('now', ?, 'utc')
    AND brief IS NOT NULL
  GROUP BY
    series_type,
    series_name
  ORDER BY
    quantity DESC;
  `)

  const result = await stmt.all(`-${timeLimit} seconds`)
  await stmt.finalize()

  return result
}

export async function modelsAccessedList(
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
    model,
    count(model) AS model_count
  FROM
    prisma_queries
  WHERE
    datetime (start_nano / 1000000000, 'unixepoch', 'utc') >= datetime ('now', ?, 'utc')
  GROUP BY
    model
  ORDER BY
    model_count DESC, model ASC;
  `)

  const result = await stmt.all(`-${timeLimit} seconds`)
  await stmt.finalize()

  return result
}
