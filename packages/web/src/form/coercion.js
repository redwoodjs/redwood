const CoercionContext = React.createContext()

export const CoercionContextProvider = ({ children }) => {
  const [coercions, setCoercions] = React.useState({})

  const setCoercion = React.useCallback(
    (name, type) => {
      setCoercions((coercions) => ({ ...coercions, [name]: type }))
    },
    [setCoercions]
  )

  const coerce = React.useCallback((name, value) => coercions[name](value), [
    coercions,
  ])

  return (
    <CoercionContext.Provider value={{ setCoercion, coerce }}>
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

  const setCoercion = (name, type, dataType) => {
    const coercionFunction =
      COERCION_FUNCTIONS[dataType || inputTypeToDataTypeMapping[type]] ||
      ((value) => value)

    coercionContext.setCoercion(name, coercionFunction)
  }

  const coerce = coercionContext.coerce

  return { setCoercion, coerce }
}
