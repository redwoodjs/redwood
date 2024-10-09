import { buildEsm } from '@redwoodjs/framework-tools'
import { generateTypesEsm } from '@redwoodjs/framework-tools/generateTypes'

await buildEsm()
await generateTypesEsm()
