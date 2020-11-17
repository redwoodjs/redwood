import fs from 'fs'
import path from 'path'

import { isEqual } from 'lodash'
import { getPaths } from 'src/lib'

const tailwindConfig = jest
  .requireActual('fs')
  .readFileSync(path.join(global.__dirname, 'fixtures', 'tailwind.config.js'))
  .toString()

const configPath = path.join(getPaths().web.base, 'tailwind.config.js')

export default function mockExeca(cmd, args) {
  if (cmd === 'yarn' && isEqual(args, ['tailwindcss', 'init'])) {
    // Simulate the creation of the tailwind config file in current dir
    fs.__setMockFiles({ 'tailwind.config.js': tailwindConfig })
  } else if (cmd === 'mv' && isEqual(args, ['tailwind.config.js', 'web/'])) {
    // Simulate file move operation
    fs.__setMockFiles({
      [configPath]: fs.readFileSync('tailwind.config.js'),
    })
  }
}
