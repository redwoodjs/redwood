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

  const coerce = (name, value) => coercionContext.coercions[name](value)

  const setCoercion = ({ name, type, dataType }) => {
    const coercionFunction =
      COERCION_FUNCTIONS[dataType || inputTypeToDataTypeMapping[type]] ||
      ((value) => value)

    coercionContext.setCoercions((coercions) => ({
      ...coercions,
      [name]: coercionFunction,
    }))
  }

  return { coerce, setCoercion }
}
