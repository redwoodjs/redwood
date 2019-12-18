import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'

const name = "page"
const description = "Generates a Hammer page component"

const output = nameArg => {
  const name = pascalcase(nameArg) + 'Page'
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

const routes = nameArg => {
  const pageName = pascalcase(nameArg) + 'Page'
  const pathName = paramCase(nameArg)

  return [
    `<Route path="/${pathName}" page={${pageName}} name="${nameArg}" />`
  ]
}

export default {
  name,
  description,
  files: nameArg => output(nameArg),
  routes: nameArg => routes(nameArg)
}
