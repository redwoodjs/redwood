import http from 'node:http'
import type { PassThrough } from 'node:stream'

import type { Request } from 'express'

import { getConfig, getRawConfig } from '@redwoodjs/project-config'
import { getAuthState, getRequestHeaders } from '@redwoodjs/server-store'

import { getFullUrlForFlightRequest } from '../utils.js'

import type { RenderInput } from './rscWorkerCommunication.js'
import { renderRsc } from './rscWorkerCommunication.js'

const isTest = () => {
  return process.env.NODE_ENV === 'test'
}

const isDevelopment = () => {
  return process.env.NODE_ENV !== 'production' && !isTest()
}

const isStudioEnabled = () => {
  return getRawConfig()['studio'] !== undefined
}

const shouldSendToStudio = () => {
  // TODO (RSC): This should be just isDevelopment()
  // but since RSC apps currently run in production mode
  // we need to check for 'production' (aka not 'development')
  // for now when sending to Studio
  return isStudioEnabled() && !isDevelopment()
}

const getStudioPort = () => {
  return getConfig().studio.basePort
}

const processRenderRscStream = async (
  pipeable: PassThrough,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks = [] as any

    pipeable.on('data', (chunk: any) => {
      chunks.push(chunk)
    })

    pipeable.on('end', () => {
      const resultBuffer = Buffer.concat(chunks)
      const resultString = resultBuffer.toString('utf-8') as string
      resolve(resultString)
    })

    pipeable.on('error', (error) => {
      reject(error)
    })
  })
}

const postFlightToStudio = (payload: string, metadata: Record<string, any>) => {
  if (shouldSendToStudio()) {
    const base64Payload = Buffer.from(payload).toString('base64')
    const encodedMetadata = Buffer.from(JSON.stringify(metadata)).toString(
      'base64',
    )
    const jsonBody = JSON.stringify({
      flight: {
        encodedPayload: base64Payload,
        encoding: 'base64',
        encodedMetadata,
      },
    })

    // Options to configure the HTTP POST request
    // TODO (RSC): Get these from the toml and Studio config
    const options = {
      hostname: 'localhost',
      port: getStudioPort(),
      path: '/.redwood/functions/rsc-flight',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonBody),
      },
    }

    const req = http.request(options, (res) => {
      res.setEncoding('utf8')
    })

    req.on('error', (e: Error) => {
      console.error(
        `An error occurred sending the Flight Payload to Studio: ${e.message}`,
      )
    })

    req.write(jsonBody)
    req.end()
  }
}

const createStudioFlightHandler = (
  pipeable: PassThrough,
  metadata: Record<string, any>,
) => {
  if (shouldSendToStudio()) {
    processRenderRscStream(pipeable)
      .then((payload) => {
        console.debug('Sending RSC Rendered stream to Studio')
        postFlightToStudio(payload, metadata)
        console.debug('Sent RSC Rendered stream to Studio', payload, metadata)
      })
      .catch((error) => {
        console.error('An error occurred getting RSC Rendered steam:', error)
      })
  } else {
    console.debug('Studio is not enabled')
  }
}

interface StudioRenderInput extends Omit<RenderInput, 'serverState'> {
  basePath: string
  req: Request
  handleError: (e: Error) => void
}

export const sendRscFlightToStudio = async (input: StudioRenderInput) => {
  if (!shouldSendToStudio()) {
    console.debug('Studio is not enabled')
    return
  }
  const { rscId, props, rsfId, args, basePath, req, handleError } = input

  try {
    // surround renderRsc with performance metrics
    const startedAt = Date.now()
    const start = performance.now()

    // We construct the URL for the flight request from props
    // e.g. http://localhost:8910/rw-rsc/__rwjs__Routes?props=location={pathname:"/about",search:"?foo=bar""}
    // becomes http://localhost:8910/about?foo=bar
    const fullUrl = getFullUrlForFlightRequest(req, props)

    const pipeable = await renderRsc({
      rscId,
      props,
      rsfId,
      args,
      serverState: {
        headersInit: Object.fromEntries(getRequestHeaders().entries()),
        serverAuthState: getAuthState(),
        fullUrl,
      },
    })
    const endedAt = Date.now()
    const end = performance.now()
    const duration = end - start

    // collect render request metadata
    const metadata = {
      rsc: {
        rscId,
        rsfId,
        props,
        args,
      },
      request: {
        basePath,
        originalUrl: req.originalUrl,
        url: req.url,
        headers: req.headers,
      },
      performance: {
        startedAt,
        endedAt,
        duration,
      },
    }

    // send rendered request to Studio
    createStudioFlightHandler(pipeable as PassThrough, metadata)
  } catch (e) {
    if (e instanceof Error) {
      console.error('An error occurred rendering RSC and sending to Studio:', e)
      handleError(e)
    }
  }
}
