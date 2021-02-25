import toast from 'react-hot-toast'

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
