import { getConfig } from '../../internal/src/config'

import BeforeSpec from './BeforeSpec'
import { MakeServices } from './types'

export const makeServices: MakeServices = ({ services }) => {
  if (!getConfig().api.experimentalSecureServices) {
    return services
  }

  const exportServices = {}

  for (const [name, resolvers] of Object.entries(services)) {
    if (!resolvers?.beforeResolver) {
      throw new Error(
        `Must define a 'beforeResolver()' in ${name.replaceAll(
          '_',
          '/'
        )} service`
      )
    }

    const spec = new BeforeSpec(Object.keys(resolvers))
    resolvers.beforeResolver(spec)

    const exportResolvers = {}

    for (const [resolverName, resolverFunc] of Object.entries(resolvers)) {
      if (resolverName === 'beforeResolver') {
        continue
      }

      if (typeof resolverFunc === 'function') {
        // wrap resolver function in spec verification
        exportResolvers[resolverName] = (...args) => {
          spec.verify(resolverName)
          return resolverFunc(...args)
        }
      } else {
        // resolver is just a sub-type
        exportResolvers[resolverName] = resolverFunc
      }
    }
    exportServices[name] = exportResolvers
  }

  return exportServices
}
