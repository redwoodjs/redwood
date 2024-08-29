import ReactServer from 'react-server-dom-webpack/server.edge'

export function registerClientReference(id: string, name: string) {
  const reference = ReactServer.registerClientReference({}, id, name)
  return Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(reference),
      $$async: { value: true },
    },
  )
}
