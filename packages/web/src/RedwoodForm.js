import useForm, { FormContext, useFormContext } from 'react-hook-form'
import { useContext } from 'react'

const DEFAULT_MESSAGES = {
  required: 'is required',
  pattern: 'is not formatted correctly',
  minLength: 'is too short',
  maxLength: 'is too long',
  min: 'is too high',
  max: 'is too low',
  validate: 'is not valid',
}

// Massages a hash of props depending on whether the given named field has
// any errors on it

const inputTagProps = (props) => {
  const { errors, setError } = useFormContext()

  // Check for errors from server and set on field if present

  const fieldErrorsContext = useContext(FieldErrorContext)
  const contextError = fieldErrorsContext[props.name]
  if (contextError) {
    setError(props.name, 'server', contextError)
  }

  // any errors on this field
  const validationError = errors[props.name]

  // get `errorClassName` out of props and set className to it if there are
  // errors on the field
  const { errorClassName, ...tagProps } = props
  if (validationError && errorClassName) {
    tagProps.className = errorClassName
  }

  return tagProps
}

// Context for keeping track of errors from the server

const FieldErrorContext = React.createContext()

// Big error message at the top of the page explaining everything that's wrong
// with the form fields in this form

const RedwoodFormError = ({
  error,
  wrapperClassName,
  titleClassName,
  listClassName,
  listItemClassName,
}) => {
  let rootMessage = null
  let messages = null
  const hasGraphQLError = !!error?.graphQLErrors[0]
  const hasNetworkError = !!error?.networkError?.result?.errors

  if (hasGraphQLError) {
    const errors = error.graphQLErrors[0].extensions.exception.messages
    rootMessage = error.graphQLErrors[0].message
    messages = []
    for (let e in errors) {
      errors[e].map((fieldError) => {
        messages.push(`${e} ${fieldError}`)
      })
    }
  } else if (hasNetworkError) {
    rootMessage = 'An error has occurred'
    messages = error.networkError.result.errors.map(
      (error) => error.message.split(';')[1]
    )
  }

  return (
    <>
      {messages && (
        <div className={wrapperClassName}>
          <p className={titleClassName}>{rootMessage}</p>
          <ul className={listClassName}>
            {messages.map((message, index) => (
              <li key={index} className={listItemClassName}>
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

// Renders a containing <form> tag with required contexts

const RedwoodForm = (props) => {
  // deconstruct some props we care about and keep the remaining `formProps` to
  // pass to the <form> tag
  const {
    error: errorProps,
    formMethods: propFormMethods,
    onSubmit,
    ...formProps
  } = props
  const useFormMethods = useForm(props.validation)
  const formMethods = propFormMethods || useFormMethods

  return (
    <form {...formProps} onSubmit={formMethods.handleSubmit(onSubmit)}>
      <FieldErrorContext.Provider
        value={
          errorProps?.graphQLErrors[0]?.extensions?.exception?.messages || {}
        }
      >
        <FormContext {...formMethods}>{props.children}</FormContext>
      </FieldErrorContext.Provider>
    </form>
  )
}

// Renders a <label> tag that can be styled differently if errors are present
// on the related fields

const Label = (props) => {
  const tagProps = inputTagProps(props)

  return (
    <label htmlFor={props.name} {...tagProps}>
      {props.text || props.name}
    </label>
  )
}

// Renders a <span> with a validation error message if there is an error on this
// field

const FieldError = (props) => {
  const { errors } = useFormContext()
  const validationError = errors[props.name]
  const errorMessage =
    validationError &&
    (validationError.message ||
      `${props.name} ${DEFAULT_MESSAGES[validationError.type]}`)

  return validationError ? <span {...props}>{errorMessage}</span> : null
}

// Renders an <input type="hidden"> field

const HiddenField = (props) => {
  const { register } = useFormContext()

  return (
    <input
      {...props}
      type="hidden"
      id={props.id || props.name}
      ref={register()}
    />
  )
}

// Renders a <textarea> field

const TextAreaField = (props) => {
  const { register } = useFormContext()
  const tagProps = inputTagProps(props)

  return (
    <textarea
      {...tagProps}
      id={props.id || props.name}
      ref={register(props.validation)}
    />
  )
}

// Renders an <input type="text"> field

const TextField = (props) => {
  const { register } = useFormContext()
  const tagProps = inputTagProps(props)

  return (
    <input
      {...tagProps}
      type={props.type || 'text'}
      id={props.id || props.name}
      ref={register(props.validation)}
    />
  )
}

// Renders a <button type="submit">

const Submit = (props) => {
  return (
    <button {...props} type="submit">
      {props.children}
    </button>
  )
}

export {
  RedwoodForm,
  FieldErrorContext,
  RedwoodFormError,
  FieldError,
  Label,
  HiddenField,
  TextAreaField,
  TextField,
  Submit,
}
