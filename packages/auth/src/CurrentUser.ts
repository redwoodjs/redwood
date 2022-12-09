export interface CurrentUser {
  roles?: Array<string> | string
  [key: string]: unknown
}
