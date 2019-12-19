import pascalcase from 'pascalcase'
import path from 'path'
import { generateTemplate } from 'src/lib'

const files = ([componentName, ...rest]) => {
  const name = pascalcase(componentName)
  const outputPath = path.join('components', name)

  const componentPath = path.join(outputPath, `${name}.js`)
  const componentTemplate = generateTemplate(
    path.join('component', 'component.js.template'),
    { name }
  )
  const testPath = path.join(outputPath, `${name}.test.js`)
  const testTemplate = generateTemplate(
    path.join('component', 'test.js.template'),
    { name }
  )
  const readmePath = path.join(outputPath, `${name}.mdx`)
  const readmeTemplate = generateTemplate(
    path.join('component', 'readme.mdx.template'),
    { name }
  )

  return {
    [componentPath]: componentTemplate,
    [testPath]: testTemplate,
    [readmePath]: readmeTemplate,
  }
}

export default {
  name: "Component",
  command: "component",
  description: "Generates a React component",
  files: args => files(args)
}
