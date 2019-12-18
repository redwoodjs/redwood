import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'
import lodash from 'lodash/string'
import path from 'path'
import { readFile, templateRoot } from 'src/lib'

const TEMPLATE_PATH = path.join(templateRoot, 'layout', 'layout.js.template')

const files = args => {
  const [_commandName, _generatorName, layoutName, ...rest] = args
  const name = pascalcase(layoutName) + 'Layout'
  const path = `layouts/${name}/${name}.js`

  const pageTemplate = lodash.template(readFile(TEMPLATE_PATH).toString())

  return {
    [path]: pageTemplate({ name, path })
  }
}

export default {
  name: "Layout",
  command: "layout",
  description: "Generates a Hammer layout component",
  files: (args) => files(args)
}
