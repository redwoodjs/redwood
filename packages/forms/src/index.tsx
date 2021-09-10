/**
 * @module @redwoodjs/forms
 *
 * Redwood's form library.
 * Mostly simple wrappers around `react-hook-form` that makes it even easier to use.
 *
 * @remark
 *
 * We slightly extend `react-hook-form`'s `valueAs` props because it's important for us to coerce values
 * to the correct type for GraphQL.
 * The properties that exclusive to Redwood are:
 * - `valueAsBoolean`
 * - `valueAsJSON`
 *
 * @see {@link https://react-hook-form.com/}
 *
 * @remark
 *
 * We make all of react-hook-form's exports available as well.
 *
 * @privateRemarks
 *
 * The two main hooks in this library are:
 * - `useErrorStyles`
 * - `useRegister`
 *
 * `useErrorStyles` takes care of the automatic error styling via a useEffect hook.
 *
 * `useRegister` hooks up fields to react-hook-form while providing some sensible defaults
 * based on the field's type.
 *
 * @privateRemarks
 *
 * We use `React.ComponentPropsWithRef` and `React.ComponentPropsWithoutRef` instead of `React.FC`
 * because the community seems to be shifting away from `React.FC`.
 *
 * @see {@link https://fettblog.eu/typescript-react-why-i-dont-use-react-fc/}
 * @see {@link https://github.com/facebook/create-react-app/pull/8177}
 * @see {@link https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components/}
 *
 * @privateRemarks
 *
 * As for interfaces vs types, we're going with TypesScript's recommendation to use interfaces until types are needed.
 */
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
} from 'react-hook-form'

import FormError from './FormError'

/**
 * We slightly extend react-hook-form's RegisterOptions to make working with GraphQL a little easier.
 *
 * @see {@link https://react-hook-form.com/api/useform/register}
 */
interface RedwoodRegisterOptions extends RegisterOptions {
  valueAsBoolean?: boolean
  valueAsJSON?: boolean
}

/**
 * The main interface, just to have some sort of source of truth.
 *
 * @typeParam E - The type of element; we're only ever working with a few HTMLElements.
 * `HTMLInputElement`
 *
 * `extends` constrains the generic type while `=` provides a default
 *
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints}
 */
interface FieldProps<
  Element extends
    | HTMLTextAreaElement
    | HTMLSelectElement
    | HTMLInputElement = HTMLInputElement
> {
  name: string
  errorClassName?: string
  errorStyle?: React.CSSProperties
  className?: string
  style?: React.CSSProperties
  validation?: RedwoodRegisterOptions
  type?: string
  onBlur?: React.FocusEventHandler<Element>
  onChange?: React.ChangeEventHandler<Element>
}

type UseErrorStylesProps = Pick<
  FieldProps,
  'name' | 'errorClassName' | 'errorStyle' | 'className' | 'style'
>

/**
 * Adds styling to a field when an error is present.
 *
 * @remark
 *
 * Mostly just a `useEffect` hook.
 *
 * `className` and `style` get swapped with `errorClassName` and `errorStyle` respectively
 * when an error's present (on the server or otherwise).
 */
const useErrorStyles = ({
  name,
  errorClassName,
  errorStyle,
  className,
  style,
}: UseErrorStylesProps) => {
  const {
    formState: { errors },
    setError,
  } = useFormContext()

  const serverError = useContext(ServerErrorsContext)[name]

  React.useEffect(() => {
    if (serverError) {
      setError(name, { type: 'server', message: serverError })
    }
  }, [serverError, name, setError])

  const validationError = name ? get(errors, name) : undefined

  if (validationError) {
    if (errorClassName) {
      className = errorClassName
    }

    if (errorStyle) {
      style = errorStyle
    }
  }

  return { className, style }
}

/**
 * Maps remember the order in which their keys were inserted.
 */
export const valueAsProps = new Map<string, (value: string) => boolean | JSON>()
valueAsProps.set('valueAsBoolean', (value: string) => !!value)
valueAsProps.set('valueAsJSON', (value: string) => JSON.parse(value))

/**
 * Provide some default coercion.
 *
 * If any of `react-hook-form`'s validation properties are present
 * (`valueAsNumber`, `valueAsDate`, `setValueAs`), we just return.
 *
 * Otherwise we check to see if any of the `valueAsProps` are present.
 *
 * The order here matters.
 */
const setCoercion = (
  validation: RedwoodRegisterOptions,
  { type }: { type?: string }
) => {
  if (
    validation.valueAsNumber ||
    validation.valueAsDate ||
    validation.setValueAs
  ) {
    return
  }

  const valueAsProp = [...valueAsProps.keys()].find(
    (valueAsProp) => valueAsProp in validation
  )

  if (valueAsProp) {
    validation.setValueAs = valueAsProps.get(valueAsProp)
  } else if (type && (type === 'number' || type === 'float')) {
    validation.valueAsNumber = true
  } else if (type && type === 'checkbox') {
    validation.setValueAs = valueAsProps.get('valueAsBoolean')
  }
}

type UseRegisterProps<
  Element extends
    | HTMLTextAreaElement
    | HTMLSelectElement
    | HTMLInputElement = HTMLInputElement
> = Pick<
  FieldProps<Element>,
  'name' | 'validation' | 'type' | 'onBlur' | 'onChange'
>

/**
 * useRegister
 *
 * Register the field into `react-hook-form` with defaults.
 *
 * @remark
 *
 * A field's `validation` prop is react-hook-form's RegisterOptions.
 *
 * @see {@link https://react-hook-form.com/api/useform/register}
 */
const useRegister = <
  T,
  Element extends
    | HTMLTextAreaElement
    | HTMLSelectElement
    | HTMLInputElement = HTMLInputElement
>(
  props: UseRegisterProps<Element>,
  ref?: React.ForwardedRef<T>
) => {
  const { register } = useFormContext()

  const validation = props.validation || { required: false }

  setCoercion(validation, { type: props.type })

  const {
    ref: _ref,
    onBlur: handleBlur,
    onChange: handleChange,
  } = register(props.name, validation)

  const onBlur: React.FocusEventHandler<Element> = (event) => {
    handleBlur(event)
    props?.onBlur?.(event)
  }
  const onChange: React.ChangeEventHandler<Element> = (event) => {
    handleChange(event)
    props?.onChange?.(event)
  }

  return {
    ref: (element: T) => {
      _ref(element)

      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
    },
    onBlur,
    onChange,
  }
}

/**
 * Context for keeping track of errors from the server
 */
interface ServerErrorsContextProps {
  [key: string]: string
}

const ServerErrorsContext = React.createContext({} as ServerErrorsContextProps)

interface FormProps
  extends Omit<React.ComponentPropsWithRef<'form'>, 'onSubmit'> {
  error?: any
  formMethods?: UseFormReturn
  config?: UseFormProps
  onSubmit?: (
    values: Record<string, any>,
    event?: React.BaseSyntheticEvent
  ) => void
}

/**
 * Renders a `<form>` with the required contexts.
 */
const Form = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      config,
      error: errorProps,
      formMethods: propFormMethods,
      onSubmit,
      children,
      ...rest
    },
    ref
  ) => {
    const hookFormMethods = useForm(config)
    const formMethods = propFormMethods || hookFormMethods

    return (
      <form
        ref={ref}
        {...rest}
        onSubmit={formMethods.handleSubmit((data, event) =>
          onSubmit?.(data, event)
        )}
      >
        <ServerErrorsContext.Provider
          value={
            errorProps?.graphQLErrors[0]?.extensions?.exception?.messages || {}
          }
        >
          <FormProvider {...formMethods}>{children}</FormProvider>
        </ServerErrorsContext.Provider>
      </form>
    )
  }
)

interface LabelProps
  extends Pick<FieldProps, 'errorClassName' | 'errorStyle'>,
    React.ComponentPropsWithoutRef<'label'> {
  name: string
}

/**
 * Renders a `<label>` that can be styled differently if errors are present on the related fields
 */
const Label = ({
  name,
  children,
  // for useErrorStyles
  errorClassName,
  errorStyle,
  className,
  style,
  ...rest
}: LabelProps) => {
  const styles = useErrorStyles({
    name,
    errorClassName,
    errorStyle,
    className,
    style,
  })

  return (
    <label htmlFor={name} {...rest} {...styles}>
      {children || name}
    </label>
  )
}

interface FieldErrorProps extends React.ComponentPropsWithoutRef<'span'> {
  /**
   * The name of the field the `<FieldError>`'s associated with.
   */
  name: string
}

const DEFAULT_MESSAGES = {
  required: 'is required',
  pattern: 'is not formatted correctly',
  minLength: 'is too short',
  maxLength: 'is too long',
  min: 'is too low',
  max: 'is too high',
  validate: 'is not valid',
}

/**
 * Renders a `<span>` with a validation error message if there's an error on the corresponding field.
 * If no error message is provided, a default one is used based on the type of validation that caused the error.
 *
 * @example Displaying a validation error message with `<FieldError>`
 * ```jsx
 * <Label name="name" errorClassName="error">
 *   Name
 * </Label>
 * <TextField
 *   name="name"
 *   validation={{ required: true }}
 *   errorClassName="error"
 * />
 * <FieldError name="name" className="error" />
 * ```
 *
 * @see {@link https://learn.redwoodjs.com/docs/tutorial/everyones-favorite-thing-to-build-forms#fielderror}
 *
 * @privateRemark
 *
 * This is basically a helper for a common pattern you see in `react-hook-form`:
 *
 * ```jsx
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <input {...register("firstName", { required: true })} />
 *   {errors.firstName?.type === 'required' && "First name is required"}
 * ```
 *
 * @see {@link https://react-hook-form.com/get-started#Handleerrors}
 */
const FieldError = ({ name, ...rest }: FieldErrorProps) => {
  const {
    formState: { errors },
  } = useFormContext()

  const validationError = get(errors, name)

  const errorMessage =
    validationError &&
    (validationError.message ||
      `${name} ${
        DEFAULT_MESSAGES[validationError.type as keyof typeof DEFAULT_MESSAGES]
      }`)

  return validationError ? <span {...rest}>{errorMessage}</span> : null
}

interface TextAreaFieldProps
  extends Omit<FieldProps<HTMLTextAreaElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'textarea'>, 'name'> {}

/**
 * Renders a <textarea> field.
 */
const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      name,
      id,
      // for useErrorStyles
      errorClassName,
      errorStyle,
      className,
      style,
      // for useRegister
      validation,
      onBlur,
      onChange,
      ...rest
    },
    ref
  ) => {
    const styles = useErrorStyles({
      name,
      errorClassName,
      errorStyle,
      className,
      style,
    })

    const useRegisterReturn = useRegister(
      {
        name,
        validation,
        onBlur,
        onChange,
      },
      ref
    )

    return (
      <textarea id={id || name} {...rest} {...styles} {...useRegisterReturn} />
    )
  }
)

interface SelectFieldProps
  extends Omit<FieldProps<HTMLSelectElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'select'>, 'name'> {}

/**
 * Renders a `<select>` field.
 */
const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      name,
      id,
      // for useErrorStyles
      errorClassName,
      errorStyle,
      className,
      style,
      // for useRegister
      validation,
      onBlur,
      onChange,
      ...rest
    },
    ref
  ) => {
    const styles = useErrorStyles({
      name,
      errorClassName,
      errorStyle,
      className,
      style,
    })

    const useRegisterReturn = useRegister(
      {
        name,
        validation,
        onBlur,
        onChange,
      },
      ref
    )

    return (
      <select id={id || name} {...rest} {...styles} {...useRegisterReturn} />
    )
  }
)

interface CheckboxFieldProps
  extends Omit<FieldProps<HTMLInputElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'input'>, 'name' | 'type'> {}

/**
 * Renders an `<input type="checkbox">` field.
 */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  (
    {
      name,
      id,
      // for useErrorStyles
      errorClassName,
      errorStyle,
      className,
      style,
      // for useRegister
      validation,
      onBlur,
      onChange,
      ...rest
    },
    ref
  ) => {
    const styles = useErrorStyles({
      name,
      errorClassName,
      errorStyle,
      className,
      style,
    })

    const type = 'checkbox'

    const useRegisterReturn = useRegister(
      {
        name,
        validation,
        onBlur,
        onChange,
        type,
      },
      ref
    )

    return (
      <input
        id={id || name}
        {...rest}
        /** This order ensures type="checkbox" */
        type={type}
        {...styles}
        {...useRegisterReturn}
      />
    )
  }
)

/**
 * Renders a `<button type="submit">` field.
 *
 * @example
 * ```jsx{3}
 * <Form onSubmit={onSubmit}>
 *   // ...
 *   <Submit>Save</Submit>
 * </Form>
 * ```
 */
const Submit = forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithRef<'button'>, 'type'>
>((props, ref) => <button ref={ref} type="submit" {...props} />)

/**
 * All the types we'll be generating named `<InputFields>` for (which is basically all of them).
 * Note that `'checkbox'` isn't here because we handle it separately above.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types}
 */
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

interface InputFieldProps
  extends Omit<FieldProps<HTMLInputElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'input'>, 'name' | 'type'> {
  /**
   * @privateRemarks
   *
   * With this typing, passing 'checkbox' to `<InputField>`'s type is an error, which,
   * at face value, feels like it shouldn't be.
   *
   * Even though we provide a separate `<CheckboxField>`, maybe we should reconsider the typing here?
   */
  type?: InputType
}

/**
 * Renders an `<input>` field.
 *
 * @see {@link https://redwoodjs.com/docs/form#inputfields}
 */
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      name,
      id,
      // for useErrorStyles
      errorClassName,
      errorStyle,
      className,
      style,
      // for useRegister
      validation,
      onBlur,
      onChange,
      type,
      ...rest
    },
    ref
  ) => {
    const styles = useErrorStyles({
      name,
      errorClassName,
      errorStyle,
      className,
      style,
    })

    const useRegisterReturn = useRegister(
      {
        name,
        validation,
        onBlur,
        onChange,
        type,
      },
      ref
    )

    return (
      <input
        id={id || name}
        {...rest}
        type={type}
        {...styles}
        {...useRegisterReturn}
      />
    )
  }
)

/**
 * `React.ForwardRefExoticComponent` is `forwardRef`'s return type.
 * You can hover over `<InputField>` above to see the type inference at work.
 */
const InputComponents: Record<
  string,
  React.ForwardRefExoticComponent<Omit<InputFieldProps, 'type'>>
> = {}

/**
 * Create a component for each type in `INPUT_TYPES`.
 *
 * Rather than writing out each and every component definition,
 * we use a bit of JS metaprogramming to create them all with the appropriate name.
 *
 * We end up with `InputComponents.TextField`, `InputComponents.TimeField`, etc.
 * Export those and we're good to go!
 */
INPUT_TYPES.forEach((type) => {
  InputComponents[`${pascalcase(type)}Field`] = forwardRef<
    HTMLInputElement,
    Omit<InputFieldProps, 'type'>
  >((props, ref) => <InputField ref={ref} type={type} {...props} />)
})

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
} = InputComponents

export {
  Form,
  ServerErrorsContext,
  FormError,
  FieldError,
  InputField,
  Label,
  TextAreaField,
  SelectField,
  Submit,
}

export * from 'react-hook-form'
