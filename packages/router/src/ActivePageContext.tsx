import { useContext } from 'react'

import { createNamedContext } from './util'

export type LoadingState = 'PRE_SHOW' | 'SHOW_LOADING' | 'DONE'
export type LoadingStateRecord = Record<
  string,
  | {
      state: LoadingState
      page: React.ComponentType<unknown>
    }
  | undefined
>

interface ActivePageState {
  loadingState: LoadingStateRecord
}

const ActivePageContext = createNamedContext<ActivePageState>('ActivePage')

export const ActivePageContextProvider = ActivePageContext.Provider

export const useActivePageContext = () => {
  const activePageContext = useContext(ActivePageContext)

  if (!activePageContext) {
    throw new Error(
      'useActivePageContext must be used within a ActivePageContext provider'
    )
  }

  return activePageContext
}
