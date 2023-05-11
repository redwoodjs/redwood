import React, { useContext, useEffect, useState } from 'react'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useLocation } from 'react-router-dom'

import { SearchFilterContext } from '../Context/SearchFilterContextProvider'

export default function SearchFilterBar() {
  const location = useLocation()
  const [searchFilters, dispatcher] = useContext(SearchFilterContext)

  const relevantFilters = location.pathname.startsWith('/explorer/span')
    ? searchFilters.spansFilter
    : searchFilters.tracesFilter

  const [filterValue, setFilterValue] = useState(relevantFilters)

  useEffect(() => {
    setFilterValue(relevantFilters)
  }, [location, relevantFilters])

  const updateSearchFilter = () => {
    if (location.pathname.startsWith('/explorer/span')) {
      dispatcher({
        type: 'SET_SPANS_FILTER',
        payload: filterValue,
      })
    } else if (location.pathname.startsWith('/explorer/trace')) {
      dispatcher({
        type: 'SET_TRACES_FILTER',
        payload: filterValue,
      })
    }
  }

  return (
    <div className="flex flex-1">
      <div className="flex w-full lg:ml-0">
        <label className="sr-only">Search / Filter</label>
        <div className="relative w-full text-gray-400 focus-within:text-gray-600">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
            <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <input
            className="block h-full w-full border-transparent py-2 pl-8 pr-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-0 focus:placeholder:text-gray-400 sm:text-sm"
            placeholder="Search / Filter"
            value={filterValue}
            onBlur={updateSearchFilter}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                updateSearchFilter()
              }
            }}
            onChange={(e) => {
              setFilterValue(e.currentTarget.value)
            }}
          />
        </div>
      </div>
    </div>
  )
}
