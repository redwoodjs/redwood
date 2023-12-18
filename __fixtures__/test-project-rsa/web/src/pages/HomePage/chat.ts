'use server'

import { randomWords } from '../../words'

export async function onSend(formData: FormData) {
  const message = formData.get('message')

  console.log('message', message)

  if (typeof message !== 'string') {
    throw new Error('message must be a string')
  }

  // Locally you could do this:
  // const words = await fetch(
  //   'https://random-word-api.herokuapp.com/word?number=5'
  // ).then((res) => res.json())
  // But in CI we don't want to hit an external API, so we just do this instead:
  const words = await randomWords(5)

  return { messages: [message, words.join(' ')] }
}

