import { $, os, quotePowerShell, quote } from 'zx'

$.quote = os.platform() === 'win32' ? quotePowerShell : quote

export default async function setup() {
  $.verbose = true
  console.log('[setup] Setting up unit test prisma db....')
  await $`npx prisma db push --accept-data-loss --schema ./src/__tests__/unit-test-schema.prisma`
  console.log('[setup] Done! \n')
}
