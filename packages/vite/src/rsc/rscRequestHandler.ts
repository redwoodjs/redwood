import http from 'node:http'
import type { PassThrough } from 'node:stream'

import busboy from 'busboy'
import type { Request, Response } from 'express'
import RSDWServer from 'react-server-dom-webpack/server.node.unbundled'

import { hasStatusCode } from '../lib/StatusError.js'

import { renderRsc } from './rscWorkerCommunication.js'

const { decodeReply, decodeReplyFromBusboy } = RSDWServer

async function consumeRenderRsc(pipeable: PassThrough): Promise<string> {
  // Use a promise to handle async flow
  return new Promise((resolve, reject) => {
    const chunks = [] as any

    // Listen for 'data' events
    pipeable.on('data', (chunk: any) => {
      chunks.push(chunk)
    })

    // Listen for 'end' event to know when the stream is finished
    pipeable.on('end', () => {
      // Combine all chunks into a single Buffer
      const resultBuffer = Buffer.concat(chunks)
      // Convert the Buffer to a string to view its contents
      // Assuming the content is UTF-8 encoded; adjust encoding as necessary
      const resultString = resultBuffer.toString('utf-8') as string
      resolve(resultString)
    })

    // Listen for 'error' events in case something goes wrong
    pipeable.on('error', (error) => {
      reject(error)
    })
  })
}

function postResultToStudio(result: string) {
  // Create a JSON object with the encoded result
  const jsonBody = JSON.stringify({
    data: result,
  })

  // Options to configure the HTTP POST request
  const options = {
    hostname: 'localhost',
    port: 4318,
    path: '/.redwood/functions/rsc-flight',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Sending JSON data
      'Content-Length': Buffer.byteLength(jsonBody),
    },
  }

  // Create the request object
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`)
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
    res.setEncoding('utf8')

    // Listen for response data (if needed)
    res.on('data', (chunk: any) => {
      console.log(`BODY: ${chunk}`)
    })

    // Listen for the end of the response
    res.on('end', () => {
      console.log('No more data in response.')
    })
  })

  // Listen for request errors
  req.on('error', (e: Error) => {
    console.error(`problem with request: ${e.message}`)
  })

  // Write the JSON body to request body
  req.write(jsonBody)

  // End the request
  req.end()
}

export function createRscRequestHandler() {
  // This is mounted at /rw-rsc, so will have /rw-rsc stripped from req.url
  return async (req: Request, res: Response, next: () => void) => {
    const basePath = '/rw-rsc/'
    console.log('basePath', basePath)
    console.log('req.originalUrl', req.originalUrl, 'req.url', req.url)
    console.log('req.headers.host', req.headers.host)
    console.log("req.headers['rw-rsc']", req.headers['rw-rsc'])

    // https://www.rfc-editor.org/rfc/rfc6648
    // "SHOULD NOT prefix their parameter names with "X-" or similar constructs."
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
        // TODO (RSC): For React Server Actions we need to limit the request
        // size somehow
        // https://nextjs.org/docs/app/api-reference/functions/server-actions#size-limitation
        if (req.headers['content-type']?.startsWith('multipart/form-data')) {
          console.log('RSA: multipart/form-data')
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
          console.log('RSA: regular body')
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

    console.log('rscRequestHandler: args', args)

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

        // SEND TO STUDIO SOMEHOW
        // todo: only send when in dev mode
        // Use the function and log the result or error
        consumeRenderRsc(pipeable as PassThrough)
          .then((result) => {
            console.log('Stream contents:', result)
            postResultToStudio(result)
          })
          .catch((error) => {
            console.error('Error consuming stream:', error)
          })

        pipeable.pipe(res)
      } catch (e) {
        handleError(e)
      }
    }
  }
}
