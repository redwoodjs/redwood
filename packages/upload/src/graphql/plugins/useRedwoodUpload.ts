import type { Plugin } from 'graphql-yoga'

import type { RedwoodGraphQLContext } from '@redwoodjs/graphql-server'

import { DEFAULT_UPLOAD_TOKEN_HEADER_NAME } from '../../constants'
import type { RedwoodUploadOptions } from '../../types'

export const useRedwoodUpload = (
  options: RedwoodUploadOptions,
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onContextBuilding({ extendContext }) {
      const { appName, uploadTarget, uploadTokenHeaderName, errorMessages } =
        options

      extendContext({
        useRedwoodUploadAppName: appName,
        useRedwoodUploadTarget: uploadTarget,
        useRedwoodUploadTokenHeaderName:
          uploadTokenHeaderName ?? DEFAULT_UPLOAD_TOKEN_HEADER_NAME,
        useRedwoodUploadErrorMessages: errorMessages,
      })
    },
  }
}
