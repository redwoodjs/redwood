import { useForm, FormContext, useFormContext } from 'react-hook-form'
import { useContext, useEffect } from 'react'

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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { errors, setError } = useFormContext()

  // Check for errors from server and set on field if present

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fieldErrorsContext = useContext(FieldErrorContext)
  const contextError = fieldErrorsContext[props.name]

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (contextError) {
      setError(props.name, 'server', contextError)
    }
  }, [contextError, props.name, setError])

  // any errors on this field
  const validationError = errors[props.name]

  // get errorStyle/errorClassName and replace style/className if present
  const { errorClassName, errorStyle, ...tagProps } = props
  if (validationError) {
    if (errorClassName) {
      tagProps.className = errorClassName
    }
    if (errorStyle) {
      tagProps.style = errorStyle
    }
  }

  return tagProps
}

// Context for keeping track of errors from the server

const FieldErrorContext = React.createContext()

// Big error message at the top of the page explaining everything that's wrong
// with the form fields in this form

const FormError = ({
  error,
  wrapperClassName,
  wrapperStyle,
  titleClassName,
  titleStyle,
  listClassName,
  listStyle,
  listItemClassName,
  listItemStyle,
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
        <div className={wrapperClassName} style={wrapperStyle}>
          <p className={titleClassName} style={titleStyle}>
            {rootMessage}
          </p>
          <ul className={listClassName} style={listStyle}>
            {messages.map((message, index) => (
              <li
                key={index}
                className={listItemClassName}
                style={listItemStyle}
              >
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

const Form = (props) => {
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
      {props.children || props.name}
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
      ref={register(props.validation || { required: false })}
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
      ref={register(props.validation || { required: false })}
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
      ref={register(props.validation || { required: false })}
    />
  )
}

// Renders an <input type="radio"> field
const RadioField = (props) => {
  const { register } = useFormContext()
  const tagProps = inputTagProps(props)

  return (
    <input
      {...tagProps}
      type="radio"
      id={props.id || props.name}
      ref={register(props.validation || { required: false })}
    />
  )
}

// Renders an <input type="checkbox"> field
const CheckBox = (props) => {
  const { register } = useFormContext()
  const tagProps = inputTagProps(props)

  return (
    <input
      {...tagProps}
      type="checkbox"
      id={props.id || props.name}
      ref={register(props.validation || { required: false })}
    />
  )
}

// Renders a <select> field

const SelectField = (props) => {
  const { register } = useFormContext()
  const tagProps = inputTagProps(props)

  return (
    <select
      {...tagProps}
      id={props.id || props.name}
      ref={register(props.validation || { required: false })}
    />
  )
}

// Renders a <button type="submit">
const Submit = React.forwardRef((props, ref) => (
  <button ref={ref} type="submit" {...props} />
))

export {
  Form,
  FieldErrorContext,
  FormError,
  FieldError,
  Label,
  HiddenField,
  TextAreaField,
  TextField,
  RadioField,
  CheckBox,
  SelectField,
  Submit,
}
