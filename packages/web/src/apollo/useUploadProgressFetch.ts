const parseHeaders = (rawHeaders: string): Headers => {
  const headers = new Headers()
  console.log('rawHeaders', rawHeaders)
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  const preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
  preProcessedHeaders.split(/\r?\n/).forEach((line: string) => {
    const parts = line.split(':')
    const key = parts.shift()?.trim()
    if (key) {
      const value = parts.join(':').trim()
      headers.append(key, value)
    }
  })
  console.log('preProcessedHeaders', preProcessedHeaders)
  console.log('headers', headers)
  return headers
}

type OnloadOptions = {
  status: number
  statusText: string
  headers: Headers
} & Record<string, any>

type AbortHandler = XMLHttpRequest['abort']

type UploadProgressFetchOptions = RequestInit & {
  useUploadProgress: boolean
  onProgress: (ev: ProgressEvent) => void
  onAbortPossible: (abortHandler: AbortHandler) => void
}

const uploadProgressFetch = (
  url: URL | RequestInfo,
  options: UploadProgressFetchOptions,
): Promise<Response> =>
  new Promise((resolve, reject) => {
    console.log('uploadProgressFetch', url, options)
    const xhr = new XMLHttpRequest()
    xhr.onload = () => {
      const opts: OnloadOptions = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || ''),
      }

      opts.url =
        'responseURL' in xhr
          ? xhr.responseURL
          : opts.headers.get('X-Request-URL')
      const body = 'response' in xhr ? xhr.response : (xhr as any).responseText
      resolve(new Response(body, opts))
    }
    xhr.onerror = () => {
      reject(new TypeError('Network request failed'))
    }
    xhr.ontimeout = () => {
      reject(new TypeError('Network request failed'))
    }
    xhr.open(options.method || '', url as string, true)

    Object.keys(options.headers as Headers).forEach((key) => {
      const headerValue = options.headers
        ? (options.headers[key as keyof HeadersInit] as string)
        : ''
      console.log('key', key)
      console.log('headerValue', headerValue)
      xhr.setRequestHeader(key, headerValue)
    })

    if (xhr.upload) {
      xhr.upload.onprogress = options.onProgress
    }

    options.onAbortPossible(() => xhr.abort())

    xhr.send(
      options.body as XMLHttpRequestBodyInit | Document | null | undefined,
    )
  })

// if useUpload is true, we use our custom uploadFetch to show progress of uploads
// if useUpload is false, we use the default fetch
export const useUploadProgressFetch = (
  uri: URL | RequestInfo,
  options: UploadProgressFetchOptions,
): Promise<Response> => {
  if (options.useUploadProgress) {
    return uploadProgressFetch(uri, options)
  }
  return fetch(uri, options)
}
