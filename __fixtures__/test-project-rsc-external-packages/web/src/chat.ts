'use server'

import { randomWords } from './words'

export async function onSend(formData: FormData) {
  const message = formData.get('message')

  console.log('message', message)

  if (typeof message !== 'string') {
    throw new Error('message has to be a string')
  }

  const words = await randomWords(5)

  return { messages: [message, words.join(' ')] }
}
