// helpers
const removeMessage = (messages, id) => messages.filter((msg) => msg.id !== id)

// the reducer
export default (state, action) => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      // add a message
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: state.messages.length,
            text: action.payload.text,
            classes: action.payload.classes || '',
            persist: action.payload.persist || false,
            viewed: action.payload.viewed || false,
          },
        ],
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
      if (message.viewed && !message.persist) {
        newMessages = removeMessage(state.messages, action.payload)
      } else {
        message.viewed = true
        newMessages = [...state.messages]
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
