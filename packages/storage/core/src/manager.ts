import { StorageAdapter } from './adapter'

export type Adapters = Record<string, StorageAdapter>

export type EnvironmentMapping<TAdapters> = Record<
  string,
  keyof TAdapters | Partial<Record<keyof TAdapters, keyof TAdapters>>
>

export type StorageManagerConfig<TAdapters extends Adapters> = {
  adapters: TAdapters
  default: keyof TAdapters

  env?: EnvironmentMapping<TAdapters>
}

export class StorageManager<TAdapters extends Adapters> extends StorageAdapter {
  public config: StorageManagerConfig<TAdapters>

  constructor(config: StorageManagerConfig<TAdapters>) {
    super()
    this.config = config

    // Validate the default adapter
    if (!config.default) {
      throw new Error('A default adapter must be provided')
    }
    if (!config.adapters[config.default]) {
      throw new Error(
        'The default adapter must be one of the provided adapters',
      )
    }

    // Inform the adapters of their names
    for (const name in config.adapters) {
      config.adapters[name].setName(name)
    }
  }

  // ---

  override getName(): string {
    throw new Error('Cannot get the name of the manager adapter')
  }

  override setName(_: string): void {
    throw new Error('Cannot set the name of the manager adapter')
  }

  // ---

  using(adapter: keyof TAdapters, force?: boolean): TAdapters[keyof TAdapters] {
    // Check for an environment override
    const override = this.getEnvOverride(adapter)
    if (!force && override) {
      return this.using(override, true)
    }

    if (!this.config.adapters[adapter]) {
      throw new Error(
        `Adapter '${adapter.toString()}' is not in the list of adapters`,
      )
    }
    return this.config.adapters[adapter]
  }

  default(): TAdapters[keyof TAdapters] {
    return this.using(this.config.default)
  }

  getEnvOverride(original: keyof TAdapters): keyof TAdapters | undefined {
    if (!process.env.NODE_ENV) {
      return undefined
    }

    const override = this.config.env?.[process.env.NODE_ENV]
    if (override) {
      if (typeof override === 'string') {
        return override
      }

      return (override as Partial<Record<keyof TAdapters, keyof TAdapters>>)[
        original
      ]
    }

    return undefined
  }

  findAdapter(name: string): TAdapters[keyof TAdapters] | undefined {
    const found = this.config.adapters[name]
    if (found) {
      return found as TAdapters[keyof TAdapters]
    }
    return undefined
  }

  // ---

  async readData(reference: string): Promise<Buffer> {
    return this.default().readData(reference)
  }

  async readFile(reference: string): Promise<File> {
    return this.default().readFile(reference)
  }

  async readStream<TStreamType>(
    reference: string,
  ): Promise<ReadableStream<TStreamType>> {
    return this.default().readStream<TStreamType>(reference)
  }

  async writeData(data: Buffer): Promise<string> {
    return this.default().writeData(data)
  }

  async writeFile(data: File): Promise<string> {
    return this.default().writeFile(data)
  }

  async writeStream<TStreamType>(
    data: ReadableStream<TStreamType>,
  ): Promise<string> {
    return this.default().writeStream<TStreamType>(data)
  }

  async delete(reference: string): Promise<void> {
    return this.default().delete(reference)
  }

  async exists(reference: string): Promise<boolean> {
    return this.default().exists(reference)
  }

  async getSignedUrl(reference: string): Promise<string> {
    return this.default().getSignedUrl(reference)
  }

  // ---
}
