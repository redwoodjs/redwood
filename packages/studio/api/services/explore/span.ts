import { GraphQLError } from 'graphql'

import { getDatabase } from '../../database'
import { extractFiltersFromString } from '../../lib/filtering'
import { generateSelectWithFilters } from '../../lib/sql'
import { restructureSpan } from '../span'

export const span = async (
  _parent: unknown,
  { spanId }: { spanId: string }
) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span WHERE id=?;')
  const result = await stmt.get(spanId)
  await stmt.finalize()

  return restructureSpan(result)
}

export const spans = async (
  _parent: unknown,
  { searchFilter }: { searchFilter?: string }
) => {
  let filters: any = {}
  try {
    filters = searchFilter ? extractFiltersFromString(searchFilter) : {}
  } catch (error) {
    throw new GraphQLError(error as string)
  }

  const db = await getDatabase()
  const [sql, sqlFilters] = generateSelectWithFilters('*', 'span', filters)

  // To debug uncomment the following line
  // console.log('spans', sql, { ...sqlFilters })

  const result = await db.all(sql, { ...sqlFilters })
  return result.map(restructureSpan)
}
