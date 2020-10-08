import { useEffect, useState } from 'react'

import type { FlashMessage } from './Flash.types'

import { useFlash } from './FlashContext'

interface FlashMessageProps {
  message: FlashMessage
  timeout: number
}

const FlashMessageView = ({ message, timeout }: FlashMessageProps) => {
  const { dismissMessage, cycleMessage } = useFlash()
  const [classes, setClasses] = useState('')

  useEffect(() => {
    cycleMessage(message.id)
    // cycleMessage should not trigger update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id])

  useEffect(() => {
    if (timeout) {
      const fadeOutTimer = setTimeout(() => {
        setClasses('rw-slide-up')
      }, timeout)
      return () => clearTimeout(fadeOutTimer)
    }
    return
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

interface FlashProps {
  timeout: number
}

const Flash = ({ timeout }: FlashProps) => {
  const { messages } = useFlash()

  if (!messages.length) {
    return null
  }

  return (
    <div className="rw-flash" data-testid="flash">
      {messages.map((msg) => (
        <FlashMessageView key={msg.id} message={msg} timeout={timeout} />
      ))}
    </div>
  )
}

export default Flash
