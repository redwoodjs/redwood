import { BeforeResolverSpec } from './beforeResolverSpec'
import { ServicesGlobImports, MakeServices, Services } from './types'

export const makeServices: MakeServices = ({ services }) => {
  const servicesCollection: ServicesGlobImports = {}

  for (const [name, resolvers] of Object.entries(services)) {
    // Just return the services if beforeResolver not specified
    if (!resolvers?.beforeResolver) {
      return services
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
        exportResolvers[resolverName] = (...args: Array<unknown>) => {
          spec.verify(resolverName, args)
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
