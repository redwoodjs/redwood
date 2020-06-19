import { useEffect, useState } from 'react'

import { useFlash } from 'src/flash/FlashContext'

const FlashMessage = ({ message, timeout }) => {
  const { dismissMessage, cycleMessage } = useFlash()
  const [classes, setClasses] = useState('')

  useEffect(() => {
    cycleMessage(message.id)
    // cycleMessage should not trigger update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id])

  useEffect(() => {
    let fadeOutTimer
    if (timeout) {
      fadeOutTimer = setTimeout(() => {
        setClasses('rw-slide-up')
      }, timeout)
    }
    return () => clearTimeout(fadeOutTimer)
  }, [timeout])

  return (
    <div
      className={`rw-flash-message ${message.classes} ${classes}`}
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

const Flash = ({ timeout }) => {
  const { messages } = useFlash()

  if (!messages.length) {
    return null
  }

  return (
    <div className="rw-flash" data-testid="flash">
      {messages.map((msg) => (
        <FlashMessage key={msg.id} message={msg} timeout={timeout} />
      ))}
    </div>
  )
}

export default Flash
