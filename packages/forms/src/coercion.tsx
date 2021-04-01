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

const COERCION_FUNCTIONS = {
  Boolean: (value: string) => !!value,
  Float: (value: string) => parseFloat(value),
  Int: (value: string) => parseInt(value, 10),
  Json: (value: string) => JSON.parse(value),
  DateTime: (value: string) =>
    value.length ? new Date(value).toISOString() : null,
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
