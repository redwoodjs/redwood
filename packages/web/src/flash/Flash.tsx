// import { useEffect, useState } from 'react'

import { Toaster } from 'react-hot-toast'

// import { useFlash } from 'src/flash/FlashContext'
// import type { FlashMessage } from 'src/flash/FlashReducer'

// type FlashMessageProps = {
//   message: FlashMessage
//   timeout?: number
// }

// const FlashMessageComponent = ({ message, timeout }: FlashMessageProps) => {
//   const { dismissMessage, cycleMessage } = useFlash()
//   const [classes, setClasses] = useState('')

//   useEffect(() => {
//     cycleMessage(message.id)
//     // cycleMessage should not trigger update
//   }, [cycleMessage, message.id])

//   useEffect(() => {
//     if (timeout === undefined) {
//       return
//     }

//     const fadeOutTimer = setTimeout(() => {
//       setClasses('rw-slide-up')
//     }, timeout)

//     return () => clearTimeout(fadeOutTimer)
//   }, [timeout])

//   return (
//     <div
//       className={`rw-flash-message ${message.classes} ${classes}`}
//       style={message.style}
//       data-testid="message"
//     >
//       <div className="rw-flash-message-text">{message.text}</div>
//       <div
//         className="rw-flash-message-dismiss"
//         data-testid="dismiss"
//         onClick={() => dismissMessage(message.id)}
//       >
//         +
//       </div>
//     </div>
//   )
// }

const Flash = () => {
  console.warn(
    'The <Flash> component is deprecated and will be removed in RedwoodJS v1.0. Please update your components to use <Toaster>: https://react-hot-toast.com/docs/toaster'
  )
  return <Toaster />
}

export default Flash
