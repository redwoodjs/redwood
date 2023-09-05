import type { Compiler, Chunk } from 'webpack'

export class ChunkReferencesPlugin {
  static defaultOptions = {
    outputFile: 'chunk-references.json',
  }

  options: typeof ChunkReferencesPlugin.defaultOptions

  constructor(options = {}) {
    this.options = { ...ChunkReferencesPlugin.defaultOptions, ...options }
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tap('ChunkReferencesPlugin', (compilation) => {
      const output: Array<{
        name: string | undefined
        id: string | number
        files: Array<string>
        referencedChunks: Array<string | number>
      }> = []

      compilation.chunks.forEach((chunk) => {
        if (chunk.id) {
          output.push({
            name: chunk.name,
            id: chunk.id,
            files: Array.from(chunk.files).map((f) => '/' + f),
            referencedChunks: Array.from(chunk.getAllReferencedChunks())
              .filter((c): c is Chunk & { id: string | number } => {
                return !!c.id && c.id !== chunk.id
              })
              .map((referencedChunk) => referencedChunk.id),
          })
        }
      })

      compilation.emitAsset(
        this.options.outputFile,
        new compiler.webpack.sources.RawSource(JSON.stringify(output, null, 2))
      )
    })
  }
}
