type ParseBodyResult = {
  body: string
  isBase64Encoded: boolean
}

type FastifyRequestHeader = { [header: string]: string | number | boolean }

type FastifyLambdaHeaders = FastifyRequestHeader | undefined

type FastifyLambdaMultiValueHeaders =
  | {
      [header: string]: (string | number | boolean)[]
    }
  | undefined

export const parseBody = (rawBody: string | Buffer): ParseBodyResult => {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false }
  }
  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true }
  }
  return { body: '', isBase64Encoded: false }
}

/**
 * In case there are multi-value headers that are not in the headers object,
 * we need to add them to the headers object and ensure the header names are lowercase
 * and there are multiple headers with the same name for each value.
 */
export const mergeMultiValueHeaders = (
  headers: FastifyLambdaHeaders,
  multiValueHeaders: FastifyLambdaMultiValueHeaders
): FastifyRequestHeader => {
  const mergedHeaders = headers || {}

  if (multiValueHeaders) {
    Object.keys(multiValueHeaders).forEach((headerName) => {
      const headerValue: Array<any> =
        multiValueHeaders[headerName as unknown as string]
      mergedHeaders[headerName.toLowerCase()] = headerValue.join('; ')
    })
  }

  return mergedHeaders
}
