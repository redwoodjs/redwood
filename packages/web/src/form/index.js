export * from '@redwoodjs/forms'

/**
 * @deprecated Please import from "@redwoodjs/forms"
 */
export const Form = () => {
  console.warn(`
  Deprecation notice, forms have moved:
    Pleas use:
    'import { Form } from "@redwoodjs/forms"'
    instead of:
    'import { Form } from "@redwoodjs/web"'
  `)
  return Form
}
