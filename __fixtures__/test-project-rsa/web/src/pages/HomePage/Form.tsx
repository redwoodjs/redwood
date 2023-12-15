'use client'

import React from 'react'

/** The current status of the <Chat> form */
export type ChatStatus = 'idle' | 'pending' | 'streaming'

interface Props {
  onSend: (data: FormData) => Promise<{ messages: Array<string> }>
}

export const Form = ({ onSend }: Props) => {
  // `key` is used to clear the form after each send.
  const [key, setKey] = React.useState(0)
  const [status, setStatus] = React.useState<ChatStatus>('idle')
  const [conversation, setConversation] = React.useState<Array<string>>([])
  const [submitCount, setSubmitCount] = React.useState(0)

  async function action(formData: FormData) {
    if (status !== 'idle') {
      return
    }

    setStatus('pending')

    const { messages } = await onSend(formData)

    setConversation((existing) => existing.concat(messages))
    setKey((k) => k + 1)
    setSubmitCount((count) => count + 1)

    setStatus('idle')
  }

  return (
    <>
      The form has been submitted {submitCount} times.
      <form key={key} action={action} style={{ marginTop: '1em' }}>
        {conversation.map((message, i) => (
          <p key={i}>{message}</p>
        ))}
        <input placeholder={'Say something...'} name="message" type="text" />
        <button type="submit" disabled={status === 'pending'}>
          Send
        </button>
      </form>
    </>
  )
}
