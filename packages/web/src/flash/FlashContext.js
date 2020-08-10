import React, { createContext, useReducer } from 'react'

import FlashReducer from 'src/flash/FlashReducer'

// initial state
const initialState = {
  messages: [],
}

// create context
export const FlashContext = createContext(initialState)

// providor component
export const FlashProvider = ({ children }) => {
  const [state, dispatch] = useReducer(FlashReducer, initialState)

  // dispatch actions to reducer
  function addMessage(text, options) {
    const message = { text, ...options }
    dispatch({
      type: 'ADD_MESSAGE',
      payload: message,
    })
  }

  function dismissMessage(messageId) {
    dispatch({
      type: 'DISMISS_MESSAGE',
      payload: messageId,
    })
  }

  function cycleMessage(messageId) {
    dispatch({
      type: 'CYCLE_MESSAGE',
      payload: messageId,
    })
  }

  // render
  return (
    <FlashContext.Provider
      value={{
        messages: state.messages,
        addMessage,
        dismissMessage,
        cycleMessage,
      }}
    >
      {children}
    </FlashContext.Provider>
  )
}

// a hook to use flash values
export const useFlash = () => {
  const flash = React.useContext(FlashContext)
  return flash
}
