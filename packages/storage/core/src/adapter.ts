export abstract class StorageAdapter {
  abstract getName(): string
  abstract setName(name: string): void

  // ---

  abstract readData(reference: string): Promise<Buffer>
  abstract readFile(reference: string): Promise<File>
  abstract readStream<TStreamType>(
    reference: string,
  ): Promise<ReadableStream<TStreamType>>

  abstract writeData(data: Buffer): Promise<string>
  abstract writeFile(data: File): Promise<string>
  abstract writeStream<TStreamType>(
    data: ReadableStream<TStreamType>,
  ): Promise<string>

  abstract delete(reference: string): Promise<void>

  abstract exists(reference: string): Promise<boolean>

  abstract getSignedUrl(reference: string): Promise<string>
}
