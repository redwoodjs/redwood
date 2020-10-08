import React, { createContext, useContext, useMemo } from 'react'

import useFlashReducer, {
  FlashActionCreators,
  FlashState,
} from './FlashReducer'

type FlashContextValue = FlashState & FlashActionCreators

// create context
export const FlashContext = createContext<FlashContextValue | undefined>(
  undefined
)

// provider component
export const FlashProvider: React.FC = ({ children }) => {
  const [state, actions] = useFlashReducer()

  const flashContextValue = useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions]
  )

  // render
  return (
    <FlashContext.Provider value={flashContextValue}>
      {children}
    </FlashContext.Provider>
  )
}

// a hook to use flash values
export const useFlash = () => {
  const flashContext = useContext(FlashContext)
  if (!flashContext)
    throw Error('`useFlash` can only be used inside a `FlashProvider`')
  return flashContext
}
