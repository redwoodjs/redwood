import { useContext } from 'react'

import { createNamedContext } from './internal'

const ParamsContext = createNamedContext<Record<string, unknown>>('Params')

const useParams = () => {
  const params = useContext(ParamsContext)
  return params
}

export { ParamsContext, useParams }
