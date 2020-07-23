export * from '@redwoodjs/forms'

/**
 * @deprecated Please import from "@redwoodjs/forms"
 */
export const Form = () => {
  console.warn(`
  Deprecation notice for forms:
    import { Form } from "@redwoodjs/web" has been deprecated.
    Please import from '@redwoodjs/forms'
  `)
  return Form
}
