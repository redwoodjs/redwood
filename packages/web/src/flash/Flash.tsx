import { useEffect, useState } from 'react'

import { useFlash } from 'src/flash/FlashContext'
import type { FlashMessage } from 'src/flash/FlashReducer'

type FlashMessageProps = {
  message: FlashMessage
  timeout?: number
}

const FlashMessageComponent = ({ message, timeout }: FlashMessageProps) => {
  const { dismissMessage, cycleMessage } = useFlash()
  const [classes, setClasses] = useState('')

  useEffect(() => {
    cycleMessage(message.id)
    // cycleMessage should not trigger update
  }, [cycleMessage, message.id])

  useEffect(() => {
    if (timeout === undefined) return

    const fadeOutTimer = setTimeout(() => {
      setClasses('rw-slide-up')
    }, timeout)

    return () => clearTimeout(fadeOutTimer)
  }, [timeout])

  return (
    <div
      className={`rw-flash-message ${message.classes} ${classes}`}
      style={message.style}
      data-testid="message"
    >
      <div className="rw-flash-message-text">{message.text}</div>
      <div
        className="rw-flash-message-dismiss"
        data-testid="dismiss"
        onClick={() => dismissMessage(message.id)}
      >
        +
      </div>
    </div>
  )
}

const Flash = ({ timeout }: { timeout?: number }) => {
  const { messages } = useFlash()

  if (!messages.length) {
    return null
  }

  return (
    <div className="rw-flash" data-testid="flash">
      {messages.map((msg) => (
        <FlashMessageComponent key={msg.id} message={msg} timeout={timeout} />
      ))}
    </div>
  )
}

export default Flash
