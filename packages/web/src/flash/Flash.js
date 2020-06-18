import { useEffect } from 'react'

import { useFlash } from 'src/flash/FlashContext'

const FlashMessage = ({ message, timeout }) => {
  const { dismissMessage, cycleMessage } = useFlash()

  useEffect(() => {
    cycleMessage(message.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (timeout) {
      setTimeout(() => {
        dismissMessage(message.id)
      }, timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`rw-flash-message ${message.classes}`}
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
