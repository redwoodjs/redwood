import http from 'node:http'
import type { PassThrough } from 'node:stream'

export const processRenderRscStream = async (
  pipeable: PassThrough
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

export const postFlightToStudio = (payload: string) => {
  const base64Payload = Buffer.from(payload).toString('base64')

  const jsonBody = JSON.stringify({
    flight: { encodedPayload: base64Payload, encoding: 'base64' },
  })

  // Options to configure the HTTP POST request
  // TODO (RSC): Get these fro. the toml and Studio config
  const options = {
    hostname: 'localhost',
    port: 4318,
    path: '/.redwood/functions/rsc-flight', // maybe make a config option
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
      `An error occurred sending the Flight Payload to Studio: ${e.message}`
    )
  })

  req.write(jsonBody)
  req.end()
}

export const createStudioFlightHandler = (pipeable: PassThrough) => {
  processRenderRscStream(pipeable)
    .then((payload) => {
      postFlightToStudio(payload)
    })
    .catch((error) => {
      console.error('An error occurred getting RSD Rendered steam:', error)
    })
}
