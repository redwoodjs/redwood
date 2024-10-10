/* eslint-env node */

import { fileURLToPath } from 'node:url'

import { cd, path, within, $, os, quotePowerShell, quote } from 'zx'

$.quote = os.platform() === 'win32' ? quotePowerShell : quote

const tsTemplatePath = fileURLToPath(
  new URL('../templates/ts', import.meta.url),
)
const jsTemplatePath = fileURLToPath(
  new URL('../templates/js', import.meta.url),
)

await within(async () => {
  cd(tsTemplatePath)

  await $`touch yarn.lock`
  await $`yarn`
})

await within(async () => {
  cd(jsTemplatePath)

  await $`touch yarn.lock`
  await $`yarn`
})

await $`yarn pack -o create-redwood-app.tgz`

await $`rm ${path.join(tsTemplatePath, 'yarn.lock')}`
await $`rm ${path.join(jsTemplatePath, 'yarn.lock')}`
