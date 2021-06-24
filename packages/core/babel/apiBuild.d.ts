interface BuildOptions {
  watch: boolean
}

export const build: ({ watch }: BuildOptions) => Promise<any>
