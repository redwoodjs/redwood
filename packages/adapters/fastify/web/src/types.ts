export interface RedwoodFastifyWebOptions {
  redwood?: {
    apiUrl?: string
    apiProxyTarget?: string

    /**
     * @deprecated Use `apiProxyTarget` instead.
     */
    apiHost?: string
  }
}
