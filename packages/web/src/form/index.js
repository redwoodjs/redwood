export * from '@redwoodjs/forms'

import { Form as RealForm } from '@redwoodjs/forms'

/**
 * @deprecated Please import from "@redwoodjs/forms"
 */
export const Form = (props) => {
  console.warn(`
  Deprecation notice, forms have moved:
    Pleas use:
    'import { Form } from "@redwoodjs/forms"'
    instead of:
    'import { Form } from "@redwoodjs/web"'
  `)
  return <RealForm {...props} />
}
