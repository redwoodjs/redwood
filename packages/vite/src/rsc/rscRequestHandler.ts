import busboy from 'busboy'
import type { Request, Response } from 'express'
import RSDWServer from 'react-server-dom-webpack/server.node.unbundled'

import { hasStatusCode } from '../lib/StatusError'

import { renderRsc } from './rscWorkerCommunication'

const { decodeReply, decodeReplyFromBusboy } = RSDWServer

export function createRscRequestHandler() {
  // This is mounted at /RSC, so will have /RSC stripped from req.url
  return async (req: Request, res: Response, next: () => void) => {
    const basePath = '/RSC/'
    console.log('basePath', basePath)
    console.log('req.originalUrl', req.originalUrl, 'req.url', req.url)
    console.log('req.headers.host', req.headers.host)
    console.log("req.headers['rw-rsc']", req.headers['rw-rsc'])

    // https://www.rfc-editor.org/rfc/rfc6648
    // SHOULD NOT prefix their parameter names with "X-" or similar constructs.
    if (req.headers['rw-rsc'] !== '1') {
      return next()
    }

    const url = new URL(req.originalUrl || '', 'http://' + req.headers.host)
    let rscId: string | undefined
    let props = {}
    let rsfId: string | undefined
    let args: unknown[] = []

    console.log('url.pathname', url.pathname)

    if (url.pathname.startsWith(basePath)) {
      const index = url.pathname.lastIndexOf('/')
      const params = new URLSearchParams(url.pathname.slice(index + 1))
      rscId = url.pathname.slice(basePath.length, index)
      rsfId = params.get('action_id') || undefined

      console.log('rscId', rscId)
      console.log('rsfId', rsfId)

      if (rscId && rscId !== '_') {
        res.setHeader('Content-Type', 'text/x-component')
        props = JSON.parse(params.get('props') || '{}')
      } else {
        rscId = undefined
      }

      if (rsfId) {
        if (req.headers['content-type']?.startsWith('multipart/form-data')) {
          const bb = busboy({ headers: req.headers })
          const reply = decodeReplyFromBusboy(bb)

          req.pipe(bb)
          args = await reply

          // TODO (RSC): Loop over args (to not only look at args[0])
          // TODO (RSC): Verify that this works with node16 (MDN says FormData is
          // only supported in node18 and up)
          if (args[0] instanceof FormData) {
            const serializedFormData: Record<string, any> = {}

            for (const [key, value] of args[0]) {
              // Several form fields can share the same name. This should be
              // represented as an array of the values of all those fields
              if (serializedFormData[key] !== undefined) {
                if (!Array.isArray(serializedFormData[key])) {
                  serializedFormData[key] = [serializedFormData[key]]
                }

                serializedFormData[key].push(value)
              } else {
                serializedFormData[key] = value
              }
            }

            args[0] = {
              __formData__: true,
              state: serializedFormData,
            }
          }
        } else {
          let body = ''

          for await (const chunk of req) {
            body += chunk
          }

          if (body) {
            args = await decodeReply(body)
          }
        }
      }
    }

    if (rscId || rsfId) {
      const handleError = (err: unknown) => {
        if (hasStatusCode(err)) {
          res.statusCode = err.statusCode
        } else {
          console.info('Cannot render RSC', err)
          res.statusCode = 500
        }

        // Getting a warning on GitHub about this
        // https://github.com/redwoodjs/redwood/security/code-scanning/211
        // Handle according to TODO below
        res.end(String(err))
        // TODO (RSC): When we have `yarn rw dev` support we should do this:
        // if (options.command === 'dev') {
        //   res.end(String(err))
        // } else {
        //   res.end()
        // }
      }

      try {
        const pipeable = await renderRsc({ rscId, props, rsfId, args })
        // TODO (RSC): See if we can/need to do more error handling here
        // pipeable.on(handleError)
        pipeable.pipe(res)
      } catch (e) {
        handleError(e)
      }
    }
  }
}
