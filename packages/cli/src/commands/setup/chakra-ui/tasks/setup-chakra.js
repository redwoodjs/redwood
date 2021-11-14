import fs from 'fs'

import { getPaths } from '../../../../lib'

/**
 * Transform an object to JSX props syntax
 *
 * @param obj {Record<string, any>}
 * @param options {{exclude?: string[], raw?: boolean | string[]}}
 * @returns {string[]}
 */
function objectToComponentProps(obj, options = { exclude: [], raw: false }) {
  let props = []

  for (const [key, value] of Object.entries(obj)) {
    if (!options.exclude.includes(key)) {
      if (
        options.raw === true ||
        (Array.isArray(options.raw) && options.raw.includes(key))
      ) {
        props.push(`${key}={${value}}`)
      } else {
        props.push(`${key}="${value}"`)
      }
    }
  }

  return props
}

/**
 * Wrap the redwood root component with a component
 *
 * @param content {string} the content of App.{js,tsx}
 * @param options {{
 *   component: string,
 *   props?: Record<string, any>,
 *   before?: string,
 *   after?: string
 * }}
 * @returns {string} the content of App.{js,tsx} with <XProvider> added
 */
function wrapRootComponent(content, { component, props, before, after }) {
  const [, indent, redwoodApolloProvider] = content.match(
    /(\s+)(<RedwoodApolloProvider>.*<\/RedwoodApolloProvider>)/s
  )

  const redwoodApolloProviderLines = redwoodApolloProvider
    .split('\n')
    .map((line) => '  ' + line)

  const propsAsArray = objectToComponentProps(props, {
    raw: true,
  })

  const renderContent =
    indent +
    (before ? before + indent : '') +
    `<${component}${props.length ? ' ' : ''}${propsAsArray.join(' ')}>` +
    indent +
    redwoodApolloProviderLines.join('\n') +
    indent +
    (after ? after + indent : '') +
    `</${component}>`

  return content.replace(
    /\s+<RedwoodApolloProvider>.*<\/RedwoodApolloProvider>/s,
    renderContent
  )
}

/**
 * @param content {string}
 * @param imports {string[]}
 */
function addImports(content = '', imports) {
  return imports.join('\n') + '\n' + content
}

/**
 * @returns {"todo" | "done"}
 */
export function checkSetupStatus() {
  const webAppPath = getPaths().web.app
  const content = fs.readFileSync(webAppPath).toString()
  return content.includes('ChakraProvider') ? 'done' : 'todo'
}

/**
 * @param [props] {ChakraProviderProps}
 */
export function wrapWithChakraProvider(props = {}) {
  const webAppPath = getPaths().web.app
  let content = fs.readFileSync(webAppPath).toString()
  const imports = [
    "import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'",
  ]

  content = addImports(content, imports)
  content = wrapRootComponent(content, {
    component: 'ChakraProvider',
    props,
    before: '<ColorModeScript />',
  })

  fs.writeFileSync(webAppPath, content)
}
