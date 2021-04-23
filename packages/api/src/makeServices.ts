import { getConfig } from '@redwoodjs/internal'

import { BeforeResolverSpec, MissingBeforeResolver } from './beforeResolverSpec'
import { ServicesCollection, MakeServices, Services } from './types'

export const makeServices: MakeServices = ({ services }) => {
  if (!getConfig().api.experimentalSecureServices) {
    console.warn(
      'NOTICE: Redwood v1.0 will make services secure by default. To optin to this behavior now, add `experimentalSecureServices = true` to the [api] section of your redwood.toml file. For more information: https://redwoodjs.com/docs/secure-services'
    )
    return services
  }

  const servicesCollection: ServicesCollection = {}

  for (const [name, resolvers] of Object.entries(services)) {
    if (!resolvers?.beforeResolver) {
      throw new MissingBeforeResolver(name)
    }

    const spec = new BeforeResolverSpec(Object.keys(resolvers))
    resolvers.beforeResolver(spec)

    const exportResolvers: Services = {}

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
        // resolver is just a sub-type, like posts.comments
        exportResolvers[resolverName] = resolverFunc
      }
    }
    servicesCollection[name] = exportResolvers
  }

  return servicesCollection
}
