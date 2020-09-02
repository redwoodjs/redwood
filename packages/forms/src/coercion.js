import React from 'react'
const CoercionContext = React.createContext()

export const CoercionContextProvider = ({ children }) => {
  const [coercions, setCoercions] = React.useState({})

  return (
    <CoercionContext.Provider value={{ coercions, setCoercions }}>
      {children}
    </CoercionContext.Provider>
  )
}

const COERCION_FUNCTIONS = {
  Boolean: (value) => !!value,
  Float: (value) => parseFloat(value),
  Int: (value) => parseInt(value, 10),
  Json: (value) => JSON.parse(value),
}

const inputTypeToDataTypeMapping = {
  checkbox: 'Boolean',
  number: 'Int',
}

export const useCoercion = () => {
  const coercionContext = React.useContext(CoercionContext)

  const coerce = React.useCallback(
    (name, value) =>
      coercionContext.coercions[name]
        ? coercionContext.coercions[name](value)
        : value,
    [coercionContext.coercions]
  )

  const setCoercion = React.useCallback(
    ({ name, type, transformValue }) => {
      let coercionFunction
      if (typeof transformValue === 'function') {
        coercionFunction = transformValue
      } else {
        coercionFunction =
          COERCION_FUNCTIONS[
            transformValue || inputTypeToDataTypeMapping[type]
          ] || ((value) => value)
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
