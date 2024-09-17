import fs from 'node:fs'

export function printVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
  )
  const version: string = packageJson.version

  console.log(`create-redwood-rsc-app ${version}`)
}
