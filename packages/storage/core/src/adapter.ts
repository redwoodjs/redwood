// TODO(jgmw): Use the term 'key' rather than 'reference' ala key-value store and S3

// TODO(jgmw): The metadata should include the content type and the original filename

export abstract class StorageAdapter {
  abstract getName(): string
  abstract setName(name: string): void

  // ---

  // TODO(jgmw): "Data" is not very clear, just use Buffer
  abstract readData(reference: string): Promise<Buffer>
  // TODO(jgmw): "File" does this need to exist? People should just move it to a buffer/stream anyway
  abstract readFile(reference: string): Promise<File>
  abstract readStream<TStreamType>(
    reference: string,
  ): Promise<ReadableStream<TStreamType>>

  abstract writeData(data: Buffer): Promise<string>
  abstract writeFile(data: File): Promise<string>
  abstract writeStream<TStreamType>(
    data: ReadableStream<TStreamType>,
  ): Promise<string>

  // TODO(jgmw): consider a lookup metadata function

  abstract delete(reference: string): Promise<void>

  abstract exists(reference: string): Promise<boolean>

  abstract getSignedUrl(reference: string): Promise<string>
  // TODO(jgmw): validate signed url function - maybe?
}
