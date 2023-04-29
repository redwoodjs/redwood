function isValidColumn(column: string) {
  return [
    'id',
    'trace',
    'parent',
    'name',
    'type',
    'start',
    'end',
    'duration',
  ].includes(column)
}

function renameColumn(column: string) {
  if (column === 'start') {
    return 'start_nano'
  }
  if (column === 'end') {
    return 'end_nano'
  }
  if (column === 'duration') {
    return 'duration_nano'
  }
  return column
}

export function extractFiltersFromString(filterString: string) {
  const filters: any = {}

  const searchFilters = filterString.split(' ')

  // Handle `limit`
  const limitFilters = searchFilters.filter((filter) =>
    filter.startsWith('limit:')
  )
  if (limitFilters.length > 1) {
    throw new Error('Cannot contain more than one limit')
  } else if (limitFilters?.length === 1) {
    const limitNumber = parseInt(limitFilters[0].split(':')[1])
    if (isNaN(limitNumber)) {
      throw new Error('Limit must be a number')
    }
    filters.limit = limitNumber
  }

  // Handle `sort`
  const sortFilters = searchFilters.filter((filter) =>
    filter.startsWith('sort:')
  )
  const sorts = []
  for (const sortFilter of sortFilters) {
    const sortColumn = sortFilter.split(':')[1]
    if (!isValidColumn(sortColumn)) {
      throw new Error(`Cannot sort by ${sortColumn}`)
    }
    const sortType = sortFilter.split(':')[2]
    if (!['asc', 'desc'].includes(sortType)) {
      throw new Error(`Cannot sort by ${sortType}`)
    }
    sorts.push({
      column: renameColumn(sortColumn),
      type: sortType.toUpperCase(),
    })
  }
  filters.sorts = sorts

  return filters
}
