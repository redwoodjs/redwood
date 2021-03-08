import { Toaster } from 'react-hot-toast'

/** @deprecated The <Flash> component is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use <Toaster>: https://react-hot-toast.com/docs/toaster */
const Flash = () => {
  console.warn(
    'The <Flash> component is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use <Toaster>: https://react-hot-toast.com/docs/toaster'
  )
  return <Toaster />
}

export default Flash
