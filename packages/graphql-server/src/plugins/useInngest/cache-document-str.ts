// From https://github.com/n1ru4l/envelop/blob/main/packages/plugins/response-cache/src/cache-document-str.ts

import { Plugin } from '@envelop/core'
import { DocumentNode, ExecutionArgs, print } from 'graphql'

const documentStringByDocument = new WeakMap<DocumentNode, string>()

export function useCacheDocumentString<
  // eslint-disable-next-line @typescript-eslint/ban-types
  PluginContext extends Record<string, any> = {}
>(): Plugin<PluginContext> {
  return {
    onParse({ params: { source } }) {
      return function onParseEnd({ result }) {
        if (result != null && !(result instanceof Error)) {
          documentStringByDocument.set(result, source.toString())
        }
      }
    },
  }
}

export function defaultGetDocumentString(executionArgs: ExecutionArgs): string {
  let documentString = documentStringByDocument.get(executionArgs.document)
  if (documentString == null) {
    documentString = print(executionArgs.document)
    documentStringByDocument.set(executionArgs.document, documentString)
  }
  return documentString
}
