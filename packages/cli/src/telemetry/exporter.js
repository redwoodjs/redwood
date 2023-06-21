import path from 'path'

import fs from 'fs-extra'

import { getPaths } from '@redwoodjs/project-config'

/**
 * Custom exporter which writes spans to a file inside of .redwood/spans
 */
export class CustomFileExporter {
  /**
   * @type string
   * @private
   */
  #storageFileName

  /**
   * @type fs.WriteStream
   * @private
   */
  #storageFileStream

  constructor() {
    this.#storageFileName = `${Date.now()}.json`

    // Ensure the path exists
    const storageFilePath = path.join(
      getPaths().generated.base,
      'telemetry',
      this.#storageFileName
    )
    fs.ensureDirSync(path.dirname(storageFilePath))

    // Open the file for writing, open a JSON array
    this.#storageFileStream = fs.createWriteStream(storageFilePath, {
      flags: 'w',
      autoClose: false,
    })
    this.#storageFileStream.write('[')
  }

  /**
   * Called to export sampled {@link ReadableSpan}s.
   * @param spans the list of sampled Spans to be exported.
   */
  export(spans, resultCallback) {
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i]
      delete span['_spanProcessor'] // This is a circular reference and will cause issues with JSON.stringify
      this.#storageFileStream.write(JSON.stringify(span, undefined, 2))
      if (i < spans.length - 1) {
        this.#storageFileStream.write(',')
      }
    }
    resultCallback({ code: 0 })
  }

  /** Stops the exporter. */
  shutdown() {
    // Close the JSON array and then close the file
    if (this.#storageFileStream.writable) {
      this.#storageFileStream.write(']')
      this.#storageFileStream.close()
    }
  }

  /** Immediately export all spans */
  forceFlush() {
    // Do nothing
  }
}
