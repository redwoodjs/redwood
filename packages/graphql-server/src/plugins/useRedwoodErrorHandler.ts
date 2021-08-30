import { useErrorHandler, Plugin } from '@envelop/core'
import { GraphQLError } from 'graphql'

function redwoodErrorHandler(errors: Readonly<GraphQLError[]>) {
  for (const error of errors) {
    // I want the api-server to pick this up!?
    // TODO: Move the error handling into a separate package
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import('@redwoodjs/api-server/dist/error')
      .then(({ handleError }) => {
        return handleError(error.originalError as Error)
      })
      .then(console.log)
      .catch(() => {})
  }
}

export const useRedwoodErrorHandler = (): Plugin => {
  return useErrorHandler(redwoodErrorHandler)
}
