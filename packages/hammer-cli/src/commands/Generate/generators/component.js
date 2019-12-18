import pascalcase from 'pascalcase'
import lodash from 'lodash/string'
import path from 'path'
import { readFile, templateRoot } from 'src/lib'

const COMPONENT_TEMPLATE_PATH = path.join(templateRoot, 'component', 'component.js.template')
const TEST_TEMPLATE_PATH = path.join(templateRoot, 'component', 'test.js.template')
const MDX_TEMPLATE_PATH = path.join(templateRoot, 'component', 'readme.mdx.template')

const files = args => {
  const [_commandName, _generatorName, componentName, ...rest] = args
  const name = pascalcase(componentName)
  const path = `components/${name}/${name}`

  const componentTemplate = lodash.template(readFile(COMPONENT_TEMPLATE_PATH).toString())
  const testTemplate = lodash.template(readFile(TEST_TEMPLATE_PATH).toString())
  const readmeTemplate = lodash.template(readFile(MDX_TEMPLATE_PATH).toString())

  return {
    [`${path}.js`]: componentTemplate({ name }),
    [`${path}.test.js`]: testTemplate({ name }),
    [`${path}.mdx`]: readmeTemplate({ name }),
  }
}

export default {
  name: "Component",
  command: "component",
  description: "Generates a React component",
  files: nameArg => files(nameArg)
}
