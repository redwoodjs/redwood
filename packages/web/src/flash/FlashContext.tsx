import toast from 'react-hot-toast'

/** @deprecated addMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the `toast()` API: https://react-hot-toast.com/docs/toast */
const addMessage = (text: string) => {
  console.warn(
    'addMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the `toast()` API: https://react-hot-toast.com/docs/toast'
  )
  toast(text)
}

/** @deprecated dismissMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the `toast()` API: https://react-hot-toast.com/docs/toast */
const dismissMessage = () => {
  console.warn(
    'dismissMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the react-hot-toast API: https://react-hot-toast.com/docs'
  )
}

/** @deprecated cycleMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the `toast()` API: https://react-hot-toast.com/docs/toast */
const cycleMessage = () => {
  console.warn(
    'cycleMessage is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the react-hot-toast API: https://react-hot-toast.com/docs'
  )
}

/** @deprecated useFlash is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use the `toast()` API: https://react-hot-toast.com/docs/toast */
export const useFlash = () => {
  return { addMessage, dismissMessage, cycleMessage }
}
