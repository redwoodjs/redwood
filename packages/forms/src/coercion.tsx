import React from 'react'

export interface Coercions {
  [key: string]: (value: string) => any
}

export interface CoercionContextInterface {
  coercions: Coercions
  setCoercions: React.Dispatch<React.SetStateAction<Coercions>>
}

const CoercionContext = React.createContext({} as CoercionContextInterface)

export const CoercionContextProvider: React.FC = ({ children }) => {
  const [coercions, setCoercions] = React.useState<Coercions>({})

  return (
    <CoercionContext.Provider value={{ coercions, setCoercions }}>
      {children}
    </CoercionContext.Provider>
  )
}

const coercionWarn = (type: string, value: string) => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  ) {
    console.warn(
      `Invalid ${type}. Form field validation not set.  Returning 'undefined' instead of '${value}'`
    )
  }
}

const COERCION_FUNCTIONS = {
  Boolean: (value: string) => !!value,
  Float: (value: string) => {
    const val = parseFloat(value)
    if (isNaN(val)) {
      coercionWarn('Float', value)
      return undefined
    }
    return val
  },
  Int: (value: string) => {
    const val = parseInt(value, 10)
    if (isNaN(val)) {
      coercionWarn('Int', value)
      return undefined
    }
    return val
  },
  Json: (value: string) => {
    try {
      return JSON.parse(value)
    } catch (e) {
      coercionWarn('Json', value)
      return undefined
    }
  },
  DateTime: (value: string) => {
    try {
      return new Date(value).toISOString()
    } catch (e) {
      coercionWarn('DateTime', value)
      return undefined
    }
  },
}

export type TDefinedCoercionFunctions = keyof typeof COERCION_FUNCTIONS

const inputTypeToDataTypeMapping: Record<string, TDefinedCoercionFunctions> = {
  checkbox: 'Boolean',
  number: 'Int',
  date: 'DateTime',
  'datetime-local': 'DateTime',
}

export const useCoercion = () => {
  const coercionContext = React.useContext(CoercionContext)

  const coerce = React.useCallback(
    (name: string, value: string) =>
      coercionContext.coercions[name]
        ? coercionContext.coercions[name](value)
        : value,
    [coercionContext.coercions]
  )

  const setCoercion = React.useCallback(
    ({
      name,
      type,
      transformValue,
    }: {
      name: string
      type?: string
      transformValue?: ((value: string) => any) | TDefinedCoercionFunctions
    }) => {
      let coercionFunction: (value: string) => any

      if (typeof transformValue === 'function') {
        coercionFunction = transformValue
      } else {
        if (transformValue) {
          coercionFunction = COERCION_FUNCTIONS[transformValue]
          if (
            !coercionFunction &&
            (process.env.NODE_ENV === 'development' ||
              process.env.NODE_ENV === 'test')
          ) {
            console.warn(
              'Form input ' + name + ' does not have a valid transformValue'
            )
          }
        } else if (type && inputTypeToDataTypeMapping[type]) {
          coercionFunction =
            COERCION_FUNCTIONS[inputTypeToDataTypeMapping[type]]
        } else {
          coercionFunction = (value) => value
        }
      }

      coercionContext.setCoercions.call(null, (coercions) => ({
        ...coercions,
        [name]: coercionFunction,
      }))
    },
    [coercionContext.setCoercions]
  )

  return { coerce, setCoercion }
}
