import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'

const name = "Page"
const command = "page"
const description = "Generates a Hammer page component"

const output = args => {
  const [
    _commandName,
    _generatorName,
    pageName,
    ...rest
  ] = args

  const name = pascalcase(pageName) + 'Page'
  const path = `pages/${name}/${name}.js`

  const page = `
const ${name} = () => {
  return (
    <h1>${name}</h1>
    <p>Find me in web/src/${path}</p>
  )
};

export default ${name};
`

  return { [path]: page }
}

const routes = args => {
  const [_commandName, _generatorName, name, ...rest] = args

  return [
    `<Route path="/${paramCase(name)}" page={${pascalcase(name)}Page}} name="${camelcase(name)}" />`
  ]
}

export default {
  name,
  command,
  description,
  files: (args) => output(args),
  routes: (args) => routes(args),
}
