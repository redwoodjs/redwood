import fs, { promises as asyncfs } from 'fs'
import path from 'path'

import { getPaths } from '../../../../lib'

/**
 * Asynchronously creates a file at the specified path with the provided content, join()ed with '\n'
 * If overwrite is false, and the file already exists, throws `Error(alreadyExistsError)`
 * @param {string} path File path at which to create the file
 * @param {Array} contentLines Array of lines to join and write into the file.
 * @param {Boolean} overwrite Indicates if the file should be overwritten, if it already exists.
 * @param {string} alreadyExistsError Message to throw if !overwrite && file already exists.
 * // TODO: this seems like too general of a function to belong here. Where should it go?
 */
export async function createFile({
  filepath,
  contentLines,
  overwrite = false,
  alreadyExistsError,
}) {
  if (fs.existsSync(filepath) && !overwrite) {
    throw new Error(alreadyExistsError)
  } else {
    return asyncfs
      .mkdir(path.dirname(filepath), { recursive: true })
      .then((_) => {
        return asyncfs.writeFile(filepath, contentLines.join('\n'), {
          flag: 'w',
        })
      })
      .catch((reason) => {
        console.error(`Failed to write ${filepath}. Reason: ${reason}`)
      })
  }
}

/**
 * @param {string} str The value to search for.
 * @returns true if the contents of App.[js|tsx] contains the given string, false otherwise.
 */
export function appJSContains(str) {
  const webAppPath = getPaths().web.app
  const content = fs.readFileSync(webAppPath).toString()
  return content.includes(str)
}

/**
 * Inject code into App.[js|tsx].
 * Use of wrapTag assumes there is only one use of wrappedTagName in the file. It will not work
 * correctly if there are multiple uses.
 * imports are added after the last redwoodjs import.
 * moduleScopeLines are added after the last import.
 *
 * @param {Object} options Configure behavior
 * @param {Object} options.wrapTag Configure tag-wrapping behavior
 * @param {string} options.wrapTag.wrappedComponent The name of the component to wrap.
 * @param {string} options.wrapTag.wrapperComponent The name of the component to with which to wrap.
 * @param {Object|string} options.wrapTag.wrapperProps Properties to pass to the wrapper component.
 * @param {Array} options.imports Import declarations to inject after the last redwoodjs import.
 * @param {Array} options.moduleScopeLines Lines of code to inject after the last import statement.
 */
export function extendAppJS({
  wrapTag: {
    wrappedComponent = undefined,
    wrapperComponent = undefined,
    wrapperProps = undefined,
    before = undefined,
    after = undefined,
  },
  imports = [],
  moduleScopeLines = [],
}) {
  const webAppPath = getPaths().web.app
  let content = fs.readFileSync(webAppPath).toString().split('\n')

  if (moduleScopeLines && moduleScopeLines.length) {
    content.splice(
      content.findLastIndex((l) => l.trimStart().startsWith('import')) + 1,
      0,
      '', // Empty string to add a newline when we .join('\n') below.
      ...moduleScopeLines
    )
  }

  if (imports && imports.length) {
    content.splice(
      content.findLastIndex((l) => l.includes('@redwoodjs')) + 1,
      0,
      '', // Empty string to add a newline when we .join('\n') below.
      ...imports
    )
  }

  if (wrappedComponent && wrapperComponent) {
    wrapComponentWithComponent(content, wrappedComponent, {
      component: wrapperComponent,
      props: wrapperProps,
      before,
      after,
    })
  }

  fs.writeFileSync(
    webAppPath,
    content.filter((e) => e !== undefined).join('\n')
  )
}

/**
 * Inject lines of code into an array of lines to wrap the specified component in a new component tag.
 * Increases the indentation of newly-wrapped content by two spaces (one tab).
 *
 * @param {Array} content A JSX file split by newlines.
 * @param {*} wrappedComponent The name of the component to wrap with a new tag.
 * @param {Object} _anonymousObject Configure the wrapping tag.
 * @param {string} _anonymousObject.component Name of the wrapping tag.
 * @param {Object|string|undefined} _anonymousObject.props Properties to pass to the wrapper
 * component.
 * @param {string} _anonymousObject.before A string to prepend, at the same indentation, as the
 * wrapper.
 * @param {Object} _anonymousObject.after A string to append, at the same indentation, as the wrapper.
 * @returns Nothing; modifies content in place.
 */
function wrapComponentWithComponent(
  content,
  wrappedComponent,
  { component, props, before, after }
) {
  const findTagIndex = (regexString) => {
    const openTagRegex = new RegExp(regexString)
    return content.findIndex((line) => openTagRegex.test(line))
  }

  const open = findTagIndex(`([^\S\r\n]*)<${wrappedComponent}\s*(.*)\s*>`)
  const close = findTagIndex(`([^\S\r\n]*)<\/${wrappedComponent}>`) + 1

  if (open === -1 || close === -1) {
    throw new Error(`Could not find tags for ${wrappedComponent}`)
  }

  // Assuming closeTagLine has same indent depth.
  const [, componentDepth] = content[open].match(/([^\S\r\n]*).*/)

  content.splice(
    open,
    close - open, // "Delete" the wrapped component contents. We put it back below.
    before && componentDepth + before,
    componentDepth + buildOpeningTag(component, props),
    // Increase indent of each now-nested tag by one tab (two spaces)
    ...content.slice(open, close).map((line) => '  ' + line),
    componentDepth + `</${component}>`,
    after && componentDepth + after
  )
}

/**
 *
 * @param {string} componentName Name of the component to create a tag for.
 * @param {Object|string|undefined} props Properties object, or string, to pass to the tag.
 * @returns A string containing a valid JSX opening tag.
 */
function buildOpeningTag(componentName, props) {
  const propsString = (() => {
    switch (typeof props) {
      case 'undefined':
        return ''
      case 'object':
        return objectToComponentProps(props, { raw: true }).join(' ')
      case 'string':
        return props
      default:
        throw new Error(
          `Illegal argument passed for 'props'. Required: {Object | string | undefined}, got ${typeof props}`
        )
    }
  })()

  const possibleSpace = propsString.length ? ' ' : ''
  return `<${componentName}${possibleSpace}${propsString}>`
}

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

  const doRaw = (key) =>
    options.raw === true ||
    (Array.isArray(options.raw) && options.raw.includes(key))

  for (const [key, value] of Object.entries(obj)) {
    if (options.exclude && options.exclude.includes(key)) {
      continue
    }
    if (doRaw(key)) {
      props.push(`${key}={${value}}`)
    } else {
      props.push(`${key}="${value}"`)
    }
  }

  return props
}
