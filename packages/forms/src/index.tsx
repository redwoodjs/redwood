/**
 * @module @redwoodjs/forms
 *
 * Redwood's form library.
 * Mostly simple wrappers around `react-hook-form` that make it even easier to use.
 *
 * @remarks
 *
 * @redwoodjs/forms slightly extends `react-hook-form`'s `valueAs` props because it's important for us to coerce values
 * to the correct type for GraphQL.
 * The properties that are exclusive to Redwood are:
 * - `valueAsBoolean`
 * - `valueAsJSON`
 *
 * @see {@link https://react-hook-form.com/}
 *
 * @remarks
 *
 * We make all of `react-hook-form`'s exports available as well.
 *
 * @privateRemarks
 *
 * The two main hooks in this library are:
 * - `useErrorStyles`
 * - `useRegister`
 *
 * `useErrorStyles` implements the error-specific styling via `useEffect`.
 *
 * `useRegister` hooks fields up to `react-hook-form` while providing some sensible defaults
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
 *
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces}
 */
import React, { useContext, forwardRef, ForwardedRef } from 'react'

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
 * We slightly extend `react-hook-form`'s `RegisterOptions` to make working with GraphQL easier.
 * `react-hook-form` provides the prop `setValueAs` for all-purpose coercion
 * (i.e. anything that isn't `valueAsDate` or `valueAsNumber`, which are standard HTML).
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
 *
 * `extends` constrains the generic while `=` provides a default.
 *
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints}
 *
 * @internal
 */
interface FieldProps<
  Element extends
    | HTMLTextAreaElement
    | HTMLSelectElement
    | HTMLInputElement = HTMLInputElement
> {
  name: string
  id?: string
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
 * @remarks
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

const valueAsProps = {
  valueAsBoolean: (value: string) => !!value,
  valueAsJSON: (value: string) => {
    try {
      return JSON.parse(value)
    } catch (e) {
      return null
    }
  },
}

const JSONValidation = (value: Record<string, unknown> | null) => value !== null

/**
 * Handles the flow of coercion, providing a default if none is specified. (And if it can.)
 * Also implements Redwood's extensions to `react-hook-form`'s `valueAs` props.
 *
 * If any of `react-hook-form`'s validation props are present
 * (`valueAsNumber`, `valueAsDate`, `setValueAs`), we just return.
 *
 * Otherwise we check to see if any of Redwood's `valueAs` props are present.
 */
const setCoercion = (
  validation: RedwoodRegisterOptions,
  { type, name }: { type?: string; name: string }
) => {
  if (
    validation.valueAsNumber ||
    validation.valueAsDate ||
    validation.setValueAs
  ) {
    return
  }

  const valueAsProp = Object.keys(valueAsProps).find(
    (valueAsProp) => valueAsProp in validation
  )

  if (valueAsProp) {
    validation.setValueAs =
      valueAsProps[valueAsProp as keyof typeof valueAsProps]
    delete validation[valueAsProp as keyof typeof valueAsProps]
    if (valueAsProp === 'valueAsJSON' && !validation.validate) {
      validation.validate = JSONValidation
    }
  } else if (type === 'checkbox') {
    validation.setValueAs = valueAsProps['valueAsBoolean']
  } else if (type === 'date' || type === 'datetime-local') {
    validation.valueAsDate = true
  } else if (type === 'number') {
    validation.valueAsNumber = true
  } else if (
    // type is undefined for <select> and most other fields that aren't input
    // fields
    (type === 'text' || type === undefined) &&
    /Id$/.test(name || '') &&
    !validation.required
  ) {
    // This is for handling optional relation id fields, like a text input for
    // `userId` if the user relation is optional
    validation.setValueAs = (val: string) => val || undefined
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
 * @remarks
 *
 * A field's `validation` prop is `react-hook-form`'s `RegisterOptions`
 * (with Redwood's extended `valueAs` props).
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
  props: UseRegisterProps<Element> & { element?: string },
  ref?: React.ForwardedRef<T>
) => {
  const { register } = useFormContext()

  const validation = props.validation || { required: false }

  setCoercion(validation, { type: props.type, name: props.name })

  const {
    ref: _ref,
    onBlur: handleBlur,
    onChange: handleChange,
    ...rest
  } = register(props.name, validation)

  const onBlur: React.FocusEventHandler<Element> = (event) => {
    handleBlur(event)
    props.onBlur?.(event)
  }

  const onChange: React.ChangeEventHandler<Element> = (event) => {
    handleChange(event)
    props.onChange?.(event)
  }

  return {
    ...rest,
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
 * Context for keeping track of errors from the server.
 */
interface ServerErrorsContextProps {
  [key: string]: string
}

const ServerErrorsContext = React.createContext({} as ServerErrorsContextProps)

export interface FormProps
  extends Omit<React.ComponentPropsWithRef<'form'>, 'onSubmit'> {
  error?: any
  /**
   * The methods returned by `useForm`.
   * This props's only necessary if you've called `useForm` yourself to get access to one of it's functions, like `reset`.
   *
   * @example
   *
   * ```javascript
   * const formMethods = useForm()
   *
   * const onSubmit = (data) => {
   *  sendDataToServer(data)
   *  formMethods.reset()
   * }
   *
   * return (
   *   <Form formMethods={formMethods} onSubmit={onSubmit}>
   * )
   * ```
   */
  formMethods?: UseFormReturn
  /**
   * Configures how React Hook Form performs validation, among other things.
   *
   * @example
   *
   * ```jsx
   * <Form config={{ mode: 'onBlur' }}>
   * ```
   *
   * @see {@link https://react-hook-form.com/api/useform}
   */
  config?: UseFormProps
  onSubmit?: (
    values: Record<string, any>,
    event?: React.BaseSyntheticEvent
  ) => void
}

/**
 * Renders a `<form>` with the required context.
 */
const Form = forwardRef(
  (
    {
      config,
      error: errorProps,
      formMethods: propFormMethods,
      onSubmit,
      children,
      ...rest
    }: FormProps,
    ref: ForwardedRef<HTMLFormElement>
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
            errorProps?.graphQLErrors[0]?.extensions?.properties?.messages || {}
          }
        >
          <FormProvider {...formMethods}>{children}</FormProvider>
        </ServerErrorsContext.Provider>
      </form>
    )
  }
)

export interface LabelProps
  extends Pick<FieldProps, 'errorClassName' | 'errorStyle'>,
    React.ComponentPropsWithoutRef<'label'> {
  name: string
}

/**
 * Renders a `<label>` that can be styled differently if errors are present on the related fields.
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

export interface FieldErrorProps
  extends React.ComponentPropsWithoutRef<'span'> {
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
 * Renders a `<span>` with an error message if there's a validation error on the corresponding field.
 * If no error message is provided, a default one is used based on the type of validation that caused the error.
 *
 * @example Displaying a validation error message with `<FieldError>`
 *
 * `<FieldError>` doesnt render (i.e. returns `null`) when there's no error on `<TextField>`.
 *
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
 * @privateRemarks
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

export interface TextAreaFieldProps
  extends Omit<FieldProps<HTMLTextAreaElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'textarea'>, 'name'> {}

/**
 * Renders a `<textarea>` field.
 */
const TextAreaField = forwardRef(
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
    }: TextAreaFieldProps,
    ref: ForwardedRef<HTMLTextAreaElement>
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

export interface SelectFieldProps
  extends Omit<FieldProps<HTMLSelectElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'select'>, 'name'> {}

/**
 * Renders a `<select>` field.
 */
const SelectField = forwardRef(
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
    }: SelectFieldProps,
    ref: ForwardedRef<HTMLSelectElement>
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

export interface CheckboxFieldProps
  extends Omit<FieldProps<HTMLInputElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'input'>, 'name' | 'type'> {}

/**
 * Renders an `<input type="checkbox">` field.
 */
export const CheckboxField = forwardRef(
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
    }: CheckboxFieldProps,
    ref: ForwardedRef<HTMLInputElement>
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

export interface InputFieldProps
  extends Omit<FieldProps<HTMLInputElement>, 'type'>,
    Omit<React.ComponentPropsWithRef<'input'>, 'name' | 'type'> {
  /**
   * @privateRemarks
   *
   * With this typing, passing `'checkbox'` to `<InputField>`'s type is an error, which,
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
const InputField = forwardRef(
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
    }: InputFieldProps,
    ref: ForwardedRef<HTMLInputElement>
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
