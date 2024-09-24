'use server'

import fs from 'node:fs'

export async function formAction(formData: FormData) {
  console.log(formData.get('delay'))
  console.log('cwd', process.cwd())
  await fs.promises.writeFile(
    'settings.json',
    `{ "delay": ${formData.get('delay')} }\n`
  )
}
