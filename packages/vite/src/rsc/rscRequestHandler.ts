import busboy from 'busboy'
import type { Request, Response } from 'express'
import RSDWServer from 'react-server-dom-webpack/server.node.unbundled'

import { hasStatusCode } from '../lib/StatusError'
import { renderRSC } from '../waku-lib/rsc-handler-worker'

const { decodeReply, decodeReplyFromBusboy } = RSDWServer

export function createRscRequestHandler() {
  // This is mounted at /RSC, so will have /RSC stripped from req.url
  return async (req: Request, res: Response) => {
    const basePath = '/RSC/'
    console.log('basePath', basePath)
    console.log('req.originalUrl', req.originalUrl, 'req.url', req.url)
    console.log('req.headers.host', req.headers.host)

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

        res.end(String(err))
        // TODO (RSC): When we have `yarn rw dev` support we should do this:
        // if (options.command === 'dev') {
        //   res.end(String(err))
        // } else {
        //   res.end()
        // }
      }

      try {
        const pipeable = await renderRSC({ rscId, props, rsfId, args })
        // TODO (RSC): See if we can/need to do more error handling here
        // pipeable.on(handleError)
        pipeable.pipe(res)
      } catch (e) {
        handleError(e)
      }
    }
  }
}
