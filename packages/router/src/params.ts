import { useContext } from 'react'

import { createNamedContext } from './internal'

const ParamsContext = createNamedContext('Params', {})

/** A hook that returns the current pages parameters */
const useParams = () => {
  const params = useContext(ParamsContext)
  return params
}

export { ParamsContext, useParams }
