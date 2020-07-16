import { useForm, FormContext, useFormContext } from 'react-hook-form'
import { useContext, useEffect } from 'react'
import pascalcase from 'pascalcase'

import { CoercionContextProvider, useCoercion } from './coercion'

const DEFAULT_MESSAGES = {
  required: 'is required',
  pattern: 'is not formatted correctly',
  minLength: 'is too short',
  maxLength: 'is too long',
  min: 'is too high',
  max: 'is too low',
  validate: 'is not valid',
}
const INPUT_TYPES = [
  'button',
  'checkbox',
  'color',
  'date',
  'datetime-local',
  'email',
  'file',
  'hidden',
  'image',
  'month',
  'number',
  'password',
  'radio',
  'range',
  'reset',
  'search',
  'submit',
  'tel',
  'text',
  'time',
  'url',
  'week',
]

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

  // dataType shouldn't be passed to the underlying HTML element
  delete tagProps.dataType

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
            {rootMessage !== '' ? rootMessage : 'Something went wrong.'}
          </p>
          {messages.length > 0 && (
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
          )}
        </div>
      )}
    </>
  )
}

const coerceValues = (data, coerce) => {
  const coercedData = {}

  Object.keys(data).forEach((name) => {
    coercedData[name] = coerce(name, data[name])
  })

  return coercedData
}

const FormWithCoercionContext = (props) => {
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
  const { coerce } = useCoercion()

  return (
    <form
      {...formProps}
      onSubmit={formMethods.handleSubmit((data, event) =>
        onSubmit(coerceValues(data, coerce), event)
      )}
    >
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

// Renders a containing <form> tag with required contexts

const Form = (props) => {
  return (
    <CoercionContextProvider>
      <FormWithCoercionContext {...props} />
    </CoercionContextProvider>
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

// Renders a <textarea> field

const TextAreaField = (props) => {
  const { register } = useFormContext()
  const { setCoercion } = useCoercion()

  React.useEffect(() => {
    setCoercion({ name: props.name, dataType: props.dataType })
  }, [setCoercion, props.name, props.dataType])

  const tagProps = inputTagProps(props)

  return (
    <textarea
      {...tagProps}
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

// Renders a <input>

const InputField = (props) => {
  const { register } = useFormContext()
  const { setCoercion } = useCoercion()

  React.useEffect(() => {
    setCoercion({
      name: props.name,
      type: props.type,
      dataType: props.dataType,
    })
  }, [setCoercion, props.name, props.type, props.dataType])

  const tagProps = inputTagProps(props)

  return (
    <input
      id={props.id || props.name}
      ref={register(props.validation || { required: false })}
      {...tagProps}
    />
  )
}

// Create a component for each type of Input.
//
// Uses a bit of Javascript metaprogramming to create the functions with a dynamic
// name rather than having to write out each and every component definition. In
// simple terms it creates an object with the key being the current value of `type`
// and then immediately returns the value, which is the component function definition.
//
// In the end we end up with `inputComponents.TextField` and all the others. Export those
// and we're good to go.

let inputComponents = {}
INPUT_TYPES.forEach((type) => {
  inputComponents[`${pascalcase(type)}Field`] = (props) => (
    <InputField type={type} {...props} />
  )
})

export {
  Form,
  FieldErrorContext,
  FormError,
  FieldError,
  InputField,
  Label,
  TextAreaField,
  SelectField,
  Submit,
}

export const {
  ButtonField,
  CheckboxField,
  ColorField,
  DateField,
  DatetimeLocalField,
  EmailField,
  FileField,
  HiddenField,
  ImageField,
  MonthField,
  NumberField,
  PasswordField,
  RadioField,
  RangeField,
  ResetField,
  SearchField,
  SubmitField,
  TelField,
  TextField,
  TimeField,
  UrlField,
  WeekField,
} = inputComponents
