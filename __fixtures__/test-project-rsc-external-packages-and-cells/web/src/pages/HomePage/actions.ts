'use server'

import { randomWords } from './words'

export async function onSend(formData: FormData) {
  console.log('formData entries:')
  formData.forEach((value, key) => console.log(key, value))

  await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50))

  // Want to keep something like this in the codebase to test
  // importing files that use the `server-only` package
  const words = await randomWords(5)

  return formData.get('message') + ': ' + words.join(' ')
}
