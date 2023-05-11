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
    substr(brief, 0, 255) AS series_name,
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
