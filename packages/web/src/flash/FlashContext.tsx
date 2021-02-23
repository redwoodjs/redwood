import React, { createContext, useReducer, useMemo } from 'react'

import type { FlashMessage } from 'src/flash/FlashReducer'
import FlashReducer from 'src/flash/FlashReducer'

type Message = { id: number; text: string }
type MessageOptions = Omit<FlashMessage, 'text' | 'id'>

type FlashContext = {
  messages: Message[]
  addMessage(text: string, options?: MessageOptions): void
  dismissMessage(messageId: number): void
  cycleMessage(messageId: number): void
}

export const FlashContext = createContext<FlashContext | null>(null)

export const FlashProvider: React.FunctionComponent = ({ children }) => {
  const [messages, dispatch] = useReducer(FlashReducer, [])

  const actions = useMemo(() => {
    function addMessage(text: string, options: MessageOptions = {}) {
      const message = { text, ...options }
      dispatch({
        type: 'ADD_MESSAGE',
        message,
      })
    }

    function dismissMessage(messageId: number) {
      dispatch({
        type: 'DISMISS_MESSAGE',
        messageId,
      })
    }

    function cycleMessage(messageId: number) {
      dispatch({
        type: 'CYCLE_MESSAGE',
        messageId,
      })
    }
    return { addMessage, dismissMessage, cycleMessage }
  }, [dispatch])

  const flashContextValue = useMemo(() => ({ messages, ...actions }), [
    messages,
    actions,
  ])

  return (
    <FlashContext.Provider value={flashContextValue}>
      {children}
    </FlashContext.Provider>
  )
}

export const useFlash = () => {
  const flash = React.useContext(FlashContext)
  if (!flash) {
    throw Error('useFlash must be used within a FlashProvider')
  }
  return flash
}
