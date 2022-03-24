import fs from 'fs'

import { getPaths } from '../../../../lib'

/**
 * Transform an object to JSX props syntax
 *
 * @param {Record<string, any>} obj
 * @param {{exclude?: string[], raw?: boolean | string[]}} options
 * @returns {string[]}
 */
export function objectToComponentProps(
  obj,
  options = { exclude: [], raw: false }
) {
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
 * @param {string} content the content of App.[js,tsx]
 * @param {Object} options
 * @param {string} options.component Identifier of the component with which to wrap the Root Component.
 * @param {Object} options.props A properties object to pass to the wrapping component.
 * @param {string} [options.before] String to append to the App content before the wrapping component
 * @param {string} [options.after] String to append to the App content after the wrapping component
 *
 * @returns {string} the content of App.[js,tsx] with <XProvider> added.
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
 * @param {string} content
 * @param {string[]} imports
 */
function addImports(content = '', imports) {
  return imports.join('\n') + '\n' + content
}

/**
 * @returns true if the contents of App.[js|tsx] contains the given string, false otherwise.
 */
export function appSourceContentContains(str) {
  const webAppPath = getPaths().web.app
  const content = fs.readFileSync(webAppPath).toString()
  return content.includes(str)
}

/**
 * Wrap the Redwood Root Component (RedwoodApolloProvider) with a component, optionally passing
 * props. Imports will be appended to the beginning of App.[js|tsx] if provided. Strings
 * params.before and params.after will be appended before and after the wrapping component,
 * respectively, if provided.
 *
 * @param {Object} params
 * @param {string} params.componentName Identifier of the component with which to wrap the Root Component.
 * @param {Object} params.props A properties object to pass to the wrapping component.
 * @param {Array}  params.imports Import declarations to add to the App.[js|tsx] file.
 * @param {string} params.before String to append to the App content before the wrapping component
 * @param {string} params.after String to append to the App content after the wrapping component
 */
export function wrapRootComponentWithComponent({
  componentName,
  props = {},
  imports = [],
  before = undefined,
  after = undefined,
}) {
  const webAppPath = getPaths().web.app
  let content = fs.readFileSync(webAppPath).toString()

  if (imports && imports.length) {
    content = addImports(content, imports)
  }

  content = wrapRootComponent(content, {
    component: componentName,
    props,
    before,
    after,
  })

  fs.writeFileSync(webAppPath, content)
}
