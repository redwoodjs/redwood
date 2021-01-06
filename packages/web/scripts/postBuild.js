const fs = require('fs')
const path = require('path')

console.warn(
  'warning, remove this file "scripts/postBuild.js" once Flash is converted to TypeScript'
)

const p = path.resolve(__dirname, '../dist/index.d.ts')
const typeDefs = fs.readFileSync(p, { encoding: 'utf-8' })
fs.writeFileSync(
  p,
  typeDefs.replace(
    "export * from './flash';",
    "// @ts-ignore JS Module\nexport * from './flash';"
  )
)
