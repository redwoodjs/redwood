import React, { createContext, useReducer } from 'react'

const initialState = {
  spansFilter: 'limit:128 sort:start:desc',
  tracesFilter: '',
}

const actions = {
  SET_SPANS_FILTER: 'SET_SPANS_FILTER',
  SET_TRACES_FILTER: 'SET_TRACES_FILTER',
}

const reducer = (state: typeof initialState, action: any) => {
  switch (action.type) {
    case actions.SET_SPANS_FILTER:
      return { ...state, spansFilter: action.payload }
    case actions.SET_TRACES_FILTER:
      return { ...state, tracesFilter: action.payload }
    default:
      return state
  }
}

export const SearchFilterContext = createContext<
  [typeof initialState, React.Dispatch<any>]
>([initialState, () => {}])

export default function SearchFilterContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SearchFilterContext.Provider value={useReducer(reducer, initialState)}>
      {children}
    </SearchFilterContext.Provider>
  )
}
