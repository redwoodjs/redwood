export class RedwoodError extends Error {
  /**
   * Extension fields to add to the formatted error.
   */
  extensions: Record<string, any> | undefined
  /**
   * Input element field name ket used to associate the error.
   */
  fieldName: string | undefined
  constructor(
    message: string,
    fieldName?: string,
    extensions?: Record<string, any>
  ) {
    super(message)
    this.name = 'RedwoodError'
    this.fieldName = fieldName
    this.extensions = extensions
  }
}
