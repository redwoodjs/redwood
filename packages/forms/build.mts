import { build } from '@redwoodjs/framework-tools'
import { generateTypesCjs } from '@redwoodjs/framework-tools/generateTypes'

// CJS build
await build()
await generateTypesCjs()
