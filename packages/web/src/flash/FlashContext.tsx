// import React, { createContext, useReducer, useMemo } from 'react'

import toast from 'react-hot-toast'

// import type { FlashMessage } from 'src/flash/FlashReducer'
// import FlashReducer from 'src/flash/FlashReducer'

// type Message = { id: number; text: string }
// type MessageOptions = Omit<FlashMessage, 'text' | 'id'>

// type FlashContext = {
//   messages: Message[]
//   addMessage(text: string, options?: MessageOptions): void
//   dismissMessage(messageId: number): void
//   cycleMessage(messageId: number): void
// }

// export const FlashContext = createContext<FlashContext | null>(null)

// export const FlashProvider: React.FunctionComponent = ({ children }) => {
//   const [messages, dispatch] = useReducer(FlashReducer, [])

//   const actions = useMemo(() => {
//     function addMessage(text: string) {
//       console.warn(
//         'addMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the `toast()` API: https://react-hot-toast.com/docs/toast'
//       )
//       toast(text)
//       // const message = { text, ...options }
//       // dispatch({
//       //   type: 'ADD_MESSAGE',
//       //   message,
//       // })
//     }

//     function dismissMessage() {
//       console.warn(
//         'dismissMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the react-hot-toast API: https://react-hot-toast.com/docs'
//       )
//       // dispatch({
//       //   type: 'DISMISS_MESSAGE',
//       //   messageId,
//       // })
//     }

//     function cycleMessage() {
//       console.warn(
//         'cycleMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the react-hot-toast API: https://react-hot-toast.com/docs'
//       )
//       // dispatch({
//       //   type: 'CYCLE_MESSAGE',
//       //   messageId,
//       // })
//     }
//     return { addMessage, dismissMessage, cycleMessage }
//   }, [dispatch])

//   const flashContextValue = useMemo(() => ({ messages, ...actions }), [
//     messages,
//     actions,
//   ])

//   return (
//     <FlashContext.Provider value={flashContextValue}>
//       {children}
//     </FlashContext.Provider>
//   )
// }
const addMessage = (text: string) => {
  console.warn(
    'addMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the `toast()` API: https://react-hot-toast.com/docs/toast'
  )
  toast(text)
}

const dismissMessage = () => {
  console.warn(
    'dismissMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the react-hot-toast API: https://react-hot-toast.com/docs'
  )
}

const cycleMessage = () => {
  console.warn(
    'cycleMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the react-hot-toast API: https://react-hot-toast.com/docs'
  )
}

export const useFlash = () => {
  return { addMessage, dismissMessage, cycleMessage }
}
