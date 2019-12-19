import pascalcase from 'pascalcase'
import path from 'path'
import { generateTemplate } from 'src/lib'

const files = ([layoutName, ...rest]) => {
  const name = pascalcase(layoutName) + 'Layout'
  const outputPath = path.join('layouts', name, `${name}.js`)
  const template = generateTemplate(
    path.join('layout', 'layout.js.template'),
    { name, path }
  )

  return { [outputPath]: template }
}

export default {
  name: "Layout",
  command: "layout",
  description: "Generates a Hammer layout component",
  files: args => files(args)
}
