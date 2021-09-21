import React, { useContext, forwardRef } from 'react'

import pascalcase from 'pascalcase'
import {
  get,
  useForm,
  FormProvider,
  useFormContext,
  RegisterOptions,
  UseFormReturn,
  UseFormProps,
  ValidateResult,
} from 'react-hook-form'

import {
  CoercionContextProvider,
  TDefinedCoercionFunctions,
  useCoercion,
} from './coercion'
import FormError from './FormError'

const DEFAULT_MESSAGES = {
  required: 'is required',
  pattern: 'is not formatted correctly',
  minLength: 'is too short',
  maxLength: 'is too long',
  min: 'is too low',
  max: 'is too high',
  validate: 'is not valid',
}

const INPUT_TYPES = [
  'button',
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
] as const

type InputType = typeof INPUT_TYPES[number]

// Massages a hash of props depending on whether the given named field has
// any errors on it

interface InputTagProps {
  name: string
  errorClassName?: string
  errorStyle?: React.CSSProperties
  transformValue?: ((value: string) => any) | TDefinedCoercionFunctions
  className?: string
  style?: React.CSSProperties
}

interface ValidatableFieldProps extends InputTagProps {
  validation?: RegisterOptions
  defaultValue?: string
}

const inputTagProps = <T extends InputTagProps>(
  props: T
): Omit<T, 'transformValue' | 'errorClassName' | 'errorStyle'> => {
  const {
    formState: { errors },
    setError,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useFormContext()

  // Check for errors from server and set on field if present

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fieldErrorsContext = useContext(FieldErrorContext)
  const contextError = fieldErrorsContext[props.name]

  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (contextError) {
      setError(props.name, { type: 'server', message: contextError })
    }
  }, [contextError, props.name, setError])

  // any errors on this field
  const validationError = props.name ? get(errors, props.name) : undefined

  // get errorStyle/errorClassName and replace style/className if present
  // Also remove transformValue from tagProps
  const {
    errorClassName,
    errorStyle,
    transformValue, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...tagProps
  } = props
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

// A hook-like function merge field props and return props (ref, onChange and onBlur primarily) of RHF v7 register()
const useFieldRegister = <
  T extends Omit<ValidatableFieldProps, 'defaultValue'>,
  E
>(
  props: T,
  ref?: React.ForwardedRef<E>
) => {
  const { register } = useFormContext()
  const validation = props.validation || { required: false }

  // Primarily for TextAreaField
  if (!validation.validate && props.transformValue === 'Json') {
    validation.validate = jsonValidation
  }

  const tagProps = inputTagProps(props) as T & {
    onChange?: React.ChangeEventHandler<T>
    onBlur?: React.FocusEventHandler<T>
  }
  const {
    ref: _ref,
    onBlur: handleBlur,
    onChange: handleChange,
    ...rest
  } = register(props.name, validation)

  const onBlur: React.FocusEventHandler<T> = (event) => {
    handleBlur(event)
    tagProps?.onBlur?.(event)
  }
  const onChange: React.ChangeEventHandler<T> = (event) => {
    handleChange(event)
    tagProps?.onChange?.(event)
  }

  return {
    ...tagProps,
    ...rest,
    onBlur,
    onChange,
    ref: (element: E) => {
      _ref(element)

      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
    },
  }
}

// Context for keeping track of errors from the server
interface FieldErrorContextProps {
  [key: string]: string
}
const FieldErrorContext = React.createContext({} as FieldErrorContextProps)

const coerceValues = (
  data: Record<string, string>,
  coerce: (name: string, value: string) => any
) => {
  const coercedData: Record<string, any> = {}

  Object.keys(data).forEach((name) => {
    coercedData[name] = coerce(name, data[name])
  })

  return coercedData
}

interface FormWithCoercionContext
  extends Omit<React.HTMLProps<HTMLFormElement>, 'onSubmit'> {
  error?: any
  formMethods?: UseFormReturn
  validation?: UseFormProps
  onSubmit?: (
    values: Record<string, any>,
    event?: React.BaseSyntheticEvent
  ) => void
}

const FormWithCoercionContext: React.FC<FormWithCoercionContext> = (props) => {
  // deconstruct some props we care about and keep the remaining `formProps` to
  // pass to the <form> tag
  const {
    error: errorProps,
    formMethods: propFormMethods,
    onSubmit,
    ...formProps
  } = props
  const useFormReturn = useForm(props.validation)
  const formMethods = propFormMethods || useFormReturn
  const { coerce } = useCoercion()

  return (
    <form
      {...formProps}
      onSubmit={formMethods.handleSubmit((data, event) =>
        onSubmit?.(coerceValues(data, coerce), event)
      )}
    >
      <FieldErrorContext.Provider
        value={
          errorProps?.graphQLErrors[0]?.extensions?.exception?.messages || {}
        }
      >
        <FormProvider {...formMethods}>{props.children}</FormProvider>
      </FieldErrorContext.Provider>
    </form>
  )
}

// Renders a containing <form> tag with required contexts

const Form: React.FC<FormWithCoercionContext> = (props) => {
  return (
    <CoercionContextProvider>
      <FormWithCoercionContext {...props} />
    </CoercionContextProvider>
  )
}

// Renders a <label> tag that can be styled differently if errors are present
// on the related fields

interface LabelProps {
  name: string
  errorClassName?: string
  errorStyle?: React.CSSProperties
}

const Label: React.FC<
  LabelProps & React.LabelHTMLAttributes<HTMLLabelElement>
> = (props) => {
  const tagProps = inputTagProps(props)

  return (
    <label htmlFor={props.name} {...tagProps}>
      {props.children || props.name}
    </label>
  )
}

// Renders a <span> with a validation error message if there is an error on this
// field

interface FieldErrorProps extends React.HTMLProps<HTMLSpanElement> {
  name: string
}

const FieldError = (props: FieldErrorProps) => {
  const {
    formState: { errors },
  } = useFormContext()
  const validationError = get(errors, props.name)
  const errorMessage =
    validationError &&
    (validationError.message ||
      `${props.name} ${
        DEFAULT_MESSAGES[validationError.type as keyof typeof DEFAULT_MESSAGES]
      }`)

  return validationError ? <span {...props}>{errorMessage}</span> : null
}

const jsonValidation = (value: string): ValidateResult => {
  try {
    JSON.parse(value)
    return true
  } catch (e) {
    if (e instanceof Error) {
      return e.message
    } else {
      return 'Invalid JSON'
    }
  }
}

// Renders a <textarea> field

const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  ValidatableFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  const fieldProps = useFieldRegister(props, ref)
  const { setCoercion } = useCoercion()

  React.useEffect(() => {
    setCoercion({
      name: props.name,
      transformValue: props.transformValue,
    })
  }, [setCoercion, props.name, props.transformValue])

  return <textarea id={props.id || props.name} {...fieldProps} />
})

// Renders a <select> field

const SelectField = forwardRef<
  HTMLSelectElement,
  ValidatableFieldProps & React.SelectHTMLAttributes<HTMLSelectElement>
>((props, ref) => {
  const fieldProps = useFieldRegister(props, ref)
  const { setCoercion } = useCoercion()

  React.useEffect(() => {
    setCoercion({
      name: props.name,
      transformValue: props.transformValue,
    })
  }, [setCoercion, props.name, props.transformValue])

  return <select id={props.id || props.name} {...fieldProps} />
})

// Renders a <input type="checkbox"> field

interface CheckboxFieldProps
  extends Omit<ValidatableFieldProps, 'defaultValue'> {
  defaultChecked?: boolean
}

export const CheckboxField = forwardRef<
  HTMLInputElement,
  CheckboxFieldProps & React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const fieldProps = useFieldRegister(props, ref)
  const { setCoercion } = useCoercion()
  const type = 'checkbox'

  React.useEffect(() => {
    setCoercion({
      name: props.name,
      type,
      transformValue: props.transformValue,
    })
  }, [setCoercion, props.name, type, props.transformValue])

  return <input type="checkbox" id={props.id || props.name} {...fieldProps} />
})

// Renders a <button type="submit">

const Submit = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>((props, ref) => <button ref={ref} type="submit" {...props} />)

// Renders a <input>

interface InputFieldProps extends ValidatableFieldProps {
  type?: InputType
}

const InputField = forwardRef<
  HTMLInputElement,
  InputFieldProps & React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const fieldProps = useFieldRegister(props, ref)
  const { setCoercion } = useCoercion()
  React.useEffect(() => {
    setCoercion({
      name: props.name,
      type: props.type,
      transformValue: props.transformValue,
    })
  }, [setCoercion, props.name, props.type, props.transformValue])

  return <input id={props.id || props.name} {...fieldProps} />
})

// Create a component for each type of Input.
//
// Uses a bit of Javascript metaprogramming to create the functions with a dynamic
// name rather than having to write out each and every component definition. In
// simple terms it creates an object with the key being the current value of `type`
// and then immediately returns the value, which is the component function definition.
//
// In the end we end up with `inputComponents.TextField` and all the others. Export those
// and we're good to go.

const inputComponents: Record<
  string,
  React.ForwardRefExoticComponent<
    InputFieldProps &
      React.InputHTMLAttributes<HTMLInputElement> &
      React.RefAttributes<HTMLInputElement>
  >
> = {}
INPUT_TYPES.forEach((type) => {
  inputComponents[`${pascalcase(type)}Field`] = forwardRef<
    HTMLInputElement,
    InputFieldProps & React.InputHTMLAttributes<HTMLInputElement>
  >((props, ref) => <InputField ref={ref} type={type} {...props} />)
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
