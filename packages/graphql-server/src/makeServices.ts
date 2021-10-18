import { ServicesGlobImports, MakeServices, Services } from './types'

export const makeServices: MakeServices = ({ services }) => {
  const servicesCollection: ServicesGlobImports = {}

  for (const [name, resolvers] of Object.entries(services)) {
    const exportResolvers: Services = {}

    for (const [resolverName, resolverFunc] of Object.entries(resolvers)) {
      if (typeof resolverFunc === 'function') {
        // wrap resolver function in spec verification
        exportResolvers[resolverName] = (...args: Array<unknown>) => {
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
