import { Reducer, useMemo, useReducer } from 'react'

import type { FlashMessage, FlashMessageOptions } from './Flash.types'

export interface FlashState {
  messages: Required<FlashMessage>[]
}

interface Action<T extends string, P> {
  readonly type: T
  readonly payload: P
}

type FlashAddMessageAction = Action<'ADD_MESSAGE', Omit<FlashMessage, 'id'>>
type FlashDismissMessageAction = Action<'DISMISS_MESSAGE', number>
type FlashCycleMessageAction = Action<'CYCLE_MESSAGE', number>

export type FlashAction =
  | FlashAddMessageAction
  | FlashDismissMessageAction
  | FlashCycleMessageAction

// initial state
const initialState: FlashState = {
  messages: [],
}

// helpers
const removeMessage = (messages: FlashState['messages'], id: number) =>
  messages.filter((msg) => msg.id !== id)
const updateMessage = (
  messages: FlashState['messages'],
  updatedMessage: Required<FlashMessage>
) =>
  messages.map((msg) => (msg.id !== updatedMessage.id ? msg : updatedMessage))

// the reducer
const FlashReducer: Reducer<FlashState, FlashAction> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const newMessage: Required<FlashMessage> = {
        id: state.messages.length,
        text: action.payload.text,
        style: action.payload.style ?? {},
        classes: action.payload.classes ?? '',
        persist: action.payload.persist ?? false,
        viewed: action.payload.viewed ?? false,
      }
      // add a message
      return {
        ...state,
        messages: [...state.messages, newMessage],
      }
    }
    case 'DISMISS_MESSAGE': {
      // return messages that do not match id (via payload)
      const newMessages = removeMessage(state.messages, action.payload)
      return {
        ...state,
        messages: newMessages,
      }
    }

    case 'CYCLE_MESSAGE': {
      // find the message
      // if viewed and not persist, remove it
      // else mark as viewed
      let newMessages = []
      const message = state.messages.find((msg) => msg.id === action.payload)
      if (!message) return state
      if (message.viewed && !message.persist) {
        newMessages = removeMessage(state.messages, action.payload)
      } else {
        const updatedMessage = {
          ...message,
          viewed: true,
        }
        newMessages = updateMessage(state.messages, updatedMessage)
      }
      return {
        ...state,
        messages: newMessages,
      }
    }

    default:
      return state
  }
}

export interface FlashActionCreators {
  addMessage(text: string, options: FlashMessageOptions): void
  dismissMessage(messageId: number): void
  cycleMessage(messageId: number): void
}

export default function useFlashReducer(): [
  state: FlashState,
  actions: FlashActionCreators
] {
  const [state, dispatch] = useReducer(FlashReducer, initialState)

  const actions = useMemo<FlashActionCreators>(
    () => ({
      addMessage(text, options) {
        const message = { text, ...options }
        dispatch({
          type: 'ADD_MESSAGE',
          payload: message,
        })
      },

      dismissMessage(messageId: number) {
        dispatch({
          type: 'DISMISS_MESSAGE',
          payload: messageId,
        })
      },

      cycleMessage(messageId: number) {
        dispatch({
          type: 'CYCLE_MESSAGE',
          payload: messageId,
        })
      },
    }),
    [dispatch]
  )

  return [state, actions]
}
