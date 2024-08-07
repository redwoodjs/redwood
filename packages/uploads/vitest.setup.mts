import { $ } from 'zx'

export default async function setup() {
  console.log('[setup] Setting up unit test prisma db....')
  await $`yarn clean:prisma`
  await $`npx prisma migrate reset -f --skip-seed --schema src/__tests__/unit-test-schema.prisma`
  console.log('[setup] Done! \n')
}
