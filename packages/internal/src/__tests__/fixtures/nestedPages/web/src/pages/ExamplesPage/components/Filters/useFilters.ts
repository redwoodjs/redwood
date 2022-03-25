import { useContext } from 'react'
import Context from 'src/pages/ExamplesPage/components/Filters/Context'
import { Tag } from 'types/graphql'

export type OnTagClick = (tag: string) => void

interface UseFiltersReturn {
  onTagClick: OnTagClick
  filterOn: (item: Record<'tags', Tag[]>, keep?: string) => boolean
}

export default function useFilters(): UseFiltersReturn {
  const { dispatch, ...state } = useContext(Context)

  const onTagClick = React.useCallback(
    (label) => {
      dispatch({ toggleFilter: label })
    },
    [dispatch]
  )

  const filterOn = React.useCallback(
    (item, keep) => {
      const selectedFilters = state.filters.tags

      if (!selectedFilters.length) {
        return true
      }

      const tags = item.tags.map((tag) => tag.label)

      return (
        tags.includes(keep) &&
        selectedFilters.every((filter) => tags.includes(filter))
      )
    },
    [state.filters.tags]
  )

  return { filterOn, onTagClick }
}
