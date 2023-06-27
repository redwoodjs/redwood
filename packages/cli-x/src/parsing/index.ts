export type ArgumentType = 'string' | 'number' | 'boolean' | 'json'

export interface PositionalArgument {
  name: string
  description: string
  required: boolean
  variadic: boolean

  default?: any

  type?: ArgumentType
}

export interface KeywordArgument {
  name: string
  description: string
  required: boolean
  variadic: boolean

  default?: any

  short?: string
  aliases?: string[]

  type?: ArgumentType
}

// TODO: Once working we should go through and try to make this as efficient as possible/practical

export function parse(
  args: string[],
  positionalArgumentsDefinitions?: PositionalArgument[],
  keywordArgumentsDefinitions?: KeywordArgument[]
) {
  // default to no arguments
  positionalArgumentsDefinitions ??= []
  keywordArgumentsDefinitions ??= []

  // extract the positional and keyword arguments
  const positionalArgumentValues = []
  const keywordArgumentValues = []

  let encounteredKeyword = false
  let encounteredDoubleDash = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--') {
      encounteredDoubleDash = true
      continue
    }

    // all arguments after '--' are positional
    if (encounteredDoubleDash) {
      positionalArgumentValues.push(arg)
      continue
    }

    // all arguments after the first keyword are keyword arguments
    if (!encounteredKeyword && arg.startsWith('-')) {
      encounteredKeyword = true
    }

    if (encounteredKeyword) {
      keywordArgumentValues.push(arg)
    } else {
      positionalArgumentValues.push(arg)
    }
  }

  // TODO: Type this properly, if we can
  const positionalArguments: any = {}

  // extract the positional arguments
  let positionalIndex = 0
  for (const positionalArgumentDefinition of positionalArgumentsDefinitions) {
    // Check that required is provided
    if (positionalArgumentDefinition.required) {
      if (positionalArgumentValues.length <= positionalIndex) {
        throw new Error(
          `Missing required positional argument: '${positionalArgumentDefinition.name}'`
        )
      }
    }

    // have to handle variadic arguments differently
    if (positionalArgumentDefinition.variadic) {
      // provide a default value if none are provided
      if (positionalIndex >= positionalArgumentValues.length) {
        positionalArguments[positionalArgumentDefinition.name] =
          positionalArgumentDefinition.default
        break
      }

      // capture all remaining positional arguments
      positionalArguments[positionalArgumentDefinition.name] =
        positionalArgumentValues.slice(positionalIndex)
      positionalIndex = positionalArgumentValues.length
      break
    }

    // provide a default value if none is provided
    positionalArguments[positionalArgumentDefinition.name] =
      positionalArgumentValues[positionalIndex] ??
      positionalArgumentDefinition.default

    // TODO: Right not we return 'key: undefined' entries for optional positional arguments that were not provided, should we?

    // increment the positional we're looking at
    positionalIndex += 1
  }

  // check we read all the positional arguments provided
  if (positionalIndex < positionalArgumentValues.length) {
    throw new Error(
      `Too many positional arguments provided: '${positionalArgumentValues
        .slice(positionalIndex)
        .join(' ')}'`
    )
  }

  // type the positional arguments
  for (const positionalArgumentDefinition of positionalArgumentsDefinitions) {
    if (positionalArgumentDefinition.type === undefined) {
      continue
    }

    try {
      castType(
        positionalArguments,
        positionalArgumentDefinition.name,
        positionalArgumentDefinition.type
      )
    } catch (error) {
      throw new Error(
        `Failed to convert '${positionalArgumentDefinition.name}' to ${positionalArgumentDefinition.type}`
      )
    }
  }

  // TODO: Type this properly, if we can
  const keywordArguments: any = {}

  // extract the keyword arguments
  for (let i = 0; i < keywordArgumentValues.length; i++) {
    const keyword = keywordArgumentValues[i]

    const isShort = keyword.startsWith('-') && keyword.length === 2
    const isLong = keyword.startsWith('--') && keyword.length > 3

    // keywords must start with a '-' or '--'
    if (!isShort && !isLong) {
      throw new Error(`Invalid keyword argument: '${keyword}'`)
    }

    // support '--no-keyword' for boolean keyword arguments
    const isInvertedKeyword = isLong && keyword.startsWith('--no-')

    // find the keyword argument definition
    const keywordSearchTerm = isInvertedKeyword
      ? keyword.slice(5)
      : isShort
      ? keyword.slice(1)
      : keyword.slice(2)
    const keywordArgumentDefinition = keywordArgumentsDefinitions.find(
      (definition) =>
        definition.name === keywordSearchTerm ||
        definition.aliases?.includes(keywordSearchTerm)
    )

    // check that the keyword was expected
    if (keywordArgumentDefinition === undefined) {
      // TODO: consider better error message for '--no-keyword'
      throw new Error(`Invalid keyword argument: '${keyword}'`)
    }

    // ensure inverted keywords are boolean
    if (isInvertedKeyword && keywordArgumentDefinition.type !== 'boolean') {
      throw new Error(
        `Invalid keyword argument: '${keyword}' - cannot invert non-boolean keyword`
      )
    }

    // variadic keyword arguments cannot use the '--no-keyword' syntax
    if (isInvertedKeyword && keywordArgumentDefinition.variadic) {
      throw new Error(
        `Invalid keyword argument: '${keyword}' - cannot invert variadic keyword`
      )
    }

    // check that no more than one value for this keyword was provided
    if (
      keywordArgumentDefinition.variadic === false &&
      keywordArguments[keywordArgumentDefinition.name] !== undefined
    ) {
      throw new Error(
        `Invalid keyword argument: '${keyword}' - cannot provide more than one value for '--${keywordArgumentDefinition.name}'`
      )
    }

    // extract the value(s)
    let value: any | any[]
    if (keywordArgumentDefinition.variadic) {
      value = []
      while (i + 1 < keywordArgumentValues.length) {
        if (keywordArgumentValues[i + 1].startsWith('-')) {
          break
        }
        value.push(keywordArgumentValues[i + 1])
        i += 1
      }
      if (value.length === 0) {
        throw new Error(
          `Invalid keyword argument: '${keyword}' - no values provided for variadic keyword`
        )
      }
    } else {
      // read ahead to see the next value
      const peek = keywordArgumentValues[i + 1]
      if (keywordArgumentDefinition.type !== 'boolean') {
        if (peek === undefined || peek.startsWith('-')) {
          throw new Error(
            `Invalid keyword argument: '${keyword}' - no value provided`
          )
        }
        value = peek
        i += 1
      } else {
        // allow '--no-keyword' to be used as a boolean
        if (isInvertedKeyword) {
          value = 'false'
        } else {
          // peek ahead to see if the next value is a keyword, if it is then we allow the presence of the keyword
          // to indicate a boolean value of true
          if (peek === undefined || peek.startsWith('-')) {
            value = 'true'
          } else {
            value = peek
            i += 1
          }
        }
      }
    }

    // set the value
    const existingValue = keywordArguments[keywordArgumentDefinition.name]
    if (keywordArgumentDefinition.variadic) {
      if (existingValue === undefined) {
        keywordArguments[keywordArgumentDefinition.name] = value
      } else {
        existingValue.push(...value)
      }
    } else {
      keywordArguments[keywordArgumentDefinition.name] = value
    }
  }

  // final validation of keyword arguments
  for (const keywordArgumentDefinition of keywordArgumentsDefinitions) {
    const wasProvided =
      keywordArguments[keywordArgumentDefinition.name] !== undefined

    // ensure that required keyword arguments were provided
    if (keywordArgumentDefinition.required && !wasProvided) {
      throw new Error(
        `Missing required keyword argument: '${keywordArgumentDefinition.name}'`
      )
    }

    // set the default value if none was provided
    if (!wasProvided && keywordArgumentDefinition.default !== undefined) {
      keywordArguments[keywordArgumentDefinition.name] =
        keywordArgumentDefinition.default
    }

    // type the keyword argument
    if (wasProvided && keywordArgumentDefinition.type !== undefined) {
      try {
        castType(
          keywordArguments,
          keywordArgumentDefinition.name,
          keywordArgumentDefinition.type
        )
      } catch (error) {
        // TODO: Consider if this is the best error message, only shows the name and not the alias that may have been used
        throw new Error(
          `Failed to convert '${keywordArgumentDefinition.name}' to ${keywordArgumentDefinition.type}`
        )
      }
    }
  }

  const results = {
    ...positionalArguments,
    ...keywordArguments,
  }

  // make camel case versions of any kebab case keys for convienience
  const resultEntries = Object.entries(results)
  for (let i = 0; i < resultEntries.length; i++) {
    const [key, value] = resultEntries[i]
    if (key.includes('-')) {
      results[key.replace(/-([a-z])/g, (match) => match[1].toUpperCase())] =
        value
    }
  }

  // return the parsed arguments
  return results
}

// TODO: Consider if this should be included or if it can be implemented in a better, more performant, way
function castType(container: any, key: string, type: ArgumentType) {
  const existingValue = container[key]
  if (existingValue === undefined) {
    return
  }

  const isArray = Array.isArray(existingValue)

  const convertToNumber = (value: string) => {
    const number = Number(value)
    if (Number.isNaN(number)) {
      throw new Error('NaN')
    }
    return number
  }

  // TODO: Consider if this is too strict? Should we allow truthy/falsy values? I don't think so
  const convertToBoolean = (value: string) => {
    if (value.toLowerCase() === 'true') {
      return true
    }
    if (value.toLowerCase() === 'false') {
      return false
    }
    throw new Error('Not a boolean')
  }

  switch (type) {
    case 'string':
      break
    case 'number':
      if (isArray) {
        container[key] = existingValue.map((value) => convertToNumber(value))
      } else {
        container[key] = convertToNumber(existingValue)
      }
      break
    case 'boolean':
      if (isArray) {
        container[key] = existingValue.map((value) => convertToBoolean(value))
      } else {
        container[key] = convertToBoolean(existingValue)
      }
      break
    case 'json':
      if (isArray) {
        container[key] = existingValue.map((value) => JSON.parse(value))
      } else {
        container[key] = JSON.parse(existingValue)
      }
      break
    default:
      throw new Error(`Unknown type '${type}'`)
  }
}
