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
 * - `emptyAs`
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
import { get, useForm, FormProvider, useFormContext } from 'react-hook-form'
import type {
  FieldValues,
  UseFormReturn,
  UseFormProps,
  RegisterOptions,
} from 'react-hook-form'

import FormError from './FormError'

/**
 * We slightly extend `react-hook-form`'s `RegisterOptions` to make working with GraphQL easier.
 * `react-hook-form` provides the prop `setValueAs` for all-purpose coercion
 * (i.e. anything that isn't `valueAsDate` or `valueAsNumber`, which are standard HTML).
 *
 * @see {@link https://react-hook-form.com/api/useform/register}
 */
type RedwoodRegisterOptions = RegisterOptions & {
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
  emptyAs?: EmptyAsValue
  errorClassName?: string
  errorStyle?: React.CSSProperties
  className?: string
  style?: React.CSSProperties
  validation?: RedwoodRegisterOptions
  type?: string
  onBlur?: React.FocusEventHandler<Element>
  onChange?: React.ChangeEventHandler<Element>
}

export type UseErrorStylesProps = Pick<
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

// Used to determine if a value is empty.
const isValueEmpty = (val: string): boolean => val === ''

/**
 * EmptyAsValue defines the values that can be used for the field emptyAs prop
 * It sets the value to be returned from the field if the field is empty.
 * If the valueOf prop is truly undefined (not 'undefined'), it will return
 * a default value corresponding to the type of field. (See
 * the comments above the setCoercion function for more details)
 */

export type EmptyAsValue = null | 'undefined' | 0 | ''

type ValueAsType =
  | 'valueAsDate'
  | 'valueAsJSON'
  | 'valueAsNumber'
  | 'valueAsString'

type SetValueAsFn = (val: string) => any
/*
 * One of the functions in the SET_VALUE_AS_FUNCTIONS object is
 * passed to the react-hook-forms setValueAs prop by the getSetValueAsFn
 * function which is used by the setCoercion function
 * There may be an alternate solution using closures that is less explicit, but
 * would likely be more troublesome to debug.
 */
const SET_VALUE_AS_FUNCTIONS: Record<
  ValueAsType,
  Record<string, SetValueAsFn>
> = {
  // valueAsBoolean is commented out as r-h-f does not currently support
  // setValueAs functionality for checkboxes.  May investigate future
  // integration
  /*  valueAsBoolean: {
    // r-h-f returns a boolean if a checkBox type, but also handle string case in case valueAsBoolean is used
    base: (val: boolean | string): boolean => !!val,
    emptyAsNull: (val: boolean | string): boolean | null => (val ? true : null),
    emptyAsUndefined: (val: boolean | string): boolean | undefined =>
      val ? true : undefined,
  },*/
  valueAsDate: {
    emptyAsNull: (val: string): Date | null =>
      isValueEmpty(val) ? null : new Date(val),
    emptyAsUndefined: (val: string): Date | undefined =>
      isValueEmpty(val) ? undefined : new Date(val),
    emptyAsString: (val: string): Date | '' =>
      isValueEmpty(val) ? '' : new Date(val),
    emptyAsZero: (val: string): Date | 0 =>
      isValueEmpty(val) ? 0 : new Date(val),
  },
  valueAsJSON: {
    emptyAsNull: (val: string) => {
      if (isValueEmpty(val)) {
        return null
      }
      try {
        return JSON.parse(val)
      } catch (e) {
        return NaN // represents invalid JSON parse to JSONValidation function
      }
    },
    emptyAsString: (val: string) => {
      if (isValueEmpty(val)) {
        return ''
      }
      try {
        return JSON.parse(val)
      } catch (e) {
        return NaN // represents invalid JSON parse to JSONValidation function
      }
    },
    emptyAsUndefined: (val: string) => {
      if (isValueEmpty(val)) {
        return undefined
      }
      try {
        return JSON.parse(val)
      } catch (e) {
        return NaN // represents invalid JSON parse to JSONValidation function
      }
    },
    emptyAsZero: (val: string) => {
      if (isValueEmpty(val)) {
        return 0
      }
      try {
        return JSON.parse(val)
      } catch (e) {
        return NaN // represents invalid JSON parse to JSONValidation function
      }
    },
  },
  valueAsNumber: {
    emptyAsNull: (val: string): number | null =>
      isValueEmpty(val) ? null : +val,
    emptyAsUndefined: (val: string): number | undefined =>
      isValueEmpty(val) ? undefined : +val,
    emptyAsNaN: (val: string): number | typeof NaN =>
      isValueEmpty(val) ? NaN : +val,
    emptyAsString: (val: string): number | '' =>
      isValueEmpty(val) ? '' : +val,
    emptyAsZero: (val: string): number => (isValueEmpty(val) ? 0 : +val),
  },
  valueAsString: {
    emptyAsNull: (val: string) => (isValueEmpty(val) ? null : val),
    emptyAsUndefined: (val: string) => (isValueEmpty(val) ? undefined : val),
    emptyAsString: (val: string): string => (isValueEmpty(val) ? '' : val),
    emptyAsZero: (val: string): string | number =>
      isValueEmpty(val) ? 0 : val,
  },
}

// Note that the emptyAs parameter takes precedence over the type, required,
// and isId parameters
const getSetValueAsFn = (
  type: ValueAsType,
  emptyAs: EmptyAsValue | undefined,
  required: boolean,
  isId: boolean
) => {
  const typeObj = SET_VALUE_AS_FUNCTIONS[type]
  if (typeObj === undefined) {
    throw Error(`Type ${type} is unsupported.`)
  }
  let fn
  switch (emptyAs) {
    case null:
      fn = typeObj['emptyAsNull']
      break
    case 'undefined':
      fn = typeObj['emptyAsUndefined']
      break
    case 0:
      fn = typeObj['emptyAsZero']
      break
    case '':
      fn = typeObj['emptyAsString']
      break
    case undefined:
    default:
      if (required || isId) {
        fn = typeObj.emptyAsNull
      } else {
        // set the default SetValueAsFn
        switch (type) {
          case 'valueAsNumber':
            fn = typeObj.emptyAsNaN
            break
          case 'valueAsDate':
          case 'valueAsJSON':
            fn = typeObj.emptyAsNull
            break
          case 'valueAsString':
            fn = typeObj.emptyAsString
            break
        }
      }
      break
  }
  if (fn === undefined) {
    console.error(`emptyAs prop of ${emptyAs} is unsupported for this type.`)
  }
  return fn
}

// This function is passed into r-h-f's validate function if valueAsJSON is set
const JSONValidation = (val: Record<string, unknown> | null | number) =>
  typeof val === 'number' ? !isNaN(val) : true

/**
 * ** setCoercion **
 * Handles the flow of coercion, providing a default if none is specified.
 * Also implements Redwood's extensions to `react-hook-form`'s `valueAs` props.
 *
 * To provide Redwood specific functionality, we need to override part of
 * react-hook-form`'s functionality in some cases. This is accomplished
 * through the use of the setValueAs function supported by r-h-f.
 * If a setValueAs function is provided by the user, it takes precedence over
 * the emptyAs prop.
 *
 * Redwood provides specific logic to address field empty scenarios through
 * the use of the emptyAs prop. The decision chain for behaviour on field empty
 * scenarios is as follows:
 *   1. if setValueAs is specified by the user, that will determine the behavior
 *   2  if emptyAs is specified, then the emptyAs prop will determine the
 *      field value on an empty condition.
 *   3. if { validation.required } is set, an empty field will return null; however,
 *      r-h-f's validation should engage and prevent submission of the form.
 *   4. if the field is an Id field, that is its name ends in "Id", then an empty
 *      field will return null.
 *   5. In the event of none of the above cases, the field value will be set as
 *      follows for empty field scenarios:
 *       DateFields => null
 *       NumberFields => NaN
 *       TextFields with valueAsNumber set => NaN
 *       SelectFields with valueAsNumber set => NaN
 *       SelectFields without valueAsNumber set => '' (empty string)
 *       TextFields with valueAsJSON set => null
 *       TextFields and comparable => '' (empty string)
 */

interface SetCoersionProps {
  type?: string
  name: string
  emptyAs?: EmptyAsValue
}

const setCoercion = (
  validation: RedwoodRegisterOptions,
  { type, name, emptyAs }: SetCoersionProps
) => {
  if (validation.setValueAs) {
    // Note, this case could override other props
    return
  }
  let valueAs: ValueAsType

  if (validation.valueAsBoolean || type === 'checkbox') {
    // Note the react-hook-forms setValueAs prop does not work in react-hook-forms
    // for checkboxes and thus Redwood does not provide emptyAs functionality
    // for checkboxes for now.
    return
  } else if (validation.valueAsJSON) {
    validation.validate = JSONValidation
    delete validation.valueAsJSON
    valueAs = 'valueAsJSON'
  } else if (
    type === 'date' ||
    type === 'datetime-local' ||
    validation.valueAsDate
  ) {
    valueAs = 'valueAsDate'
  } else if (type === 'number' || validation.valueAsNumber) {
    valueAs = 'valueAsNumber'
    // If we are using the emptyAs feature, it does not work well
    // with react-hook-form valueAsNumber, and thus we will rely
    // on the setValueAs function below, which will do the same thing
    if (validation.valueAsNumber && emptyAs !== undefined) {
      delete validation.valueAsNumber
    }
  } else {
    valueAs = 'valueAsString'
  }

  validation.setValueAs = getSetValueAsFn(
    valueAs, // type
    emptyAs, // emptyAs
    validation.required !== undefined && validation.required !== false, // required
    /Id$/.test(name || '') // isId
  )
}

export type UseRegisterProps<
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
  ref?: React.ForwardedRef<T>,
  emptyAs?: EmptyAsValue
) => {
  const { register } = useFormContext()
  const { name } = props
  if (!name) {
    throw Error('`name` prop must be provided')
  }

  const validation = props.validation || { required: false }

  setCoercion(validation, {
    type: props.type,
    name,
    emptyAs,
  })

  const {
    ref: _ref,
    onBlur: handleBlur,
    onChange: handleChange,
    ...rest
  } = register(name, validation)

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

export interface FormProps<TFieldValues extends FieldValues>
  extends Omit<React.ComponentPropsWithRef<'form'>, 'onSubmit'> {
  error?: any
  /**
   * The methods returned by `useForm`.
   * This prop is only necessary if you've called `useForm` yourself to get
   * access to one of its functions, like `reset`.
   *
   * @example
   *
   * ```typescript
   * const formMethods = useForm<FormData>()
   *
   * const onSubmit = (data: FormData) => {
   *  sendDataToServer(data)
   *  formMethods.reset()
   * }
   *
   * return (
   *   <Form formMethods={formMethods} onSubmit={onSubmit}>
   * )
   * ```
   */
  formMethods?: UseFormReturn<TFieldValues>
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
  config?: UseFormProps<TFieldValues>
  onSubmit?: (value: TFieldValues, event?: React.BaseSyntheticEvent) => void
}

/**
 * Renders a `<form>` with the required context.
 */
function FormInner<TFieldValues extends FieldValues>(
  {
    config,
    error: errorProps,
    formMethods: propFormMethods,
    onSubmit,
    children,
    ...rest
  }: FormProps<TFieldValues>,
  ref: ForwardedRef<HTMLFormElement>
) {
  const hookFormMethods = useForm<TFieldValues>(config)
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
          errorProps?.graphQLErrors?.[0]?.extensions?.properties?.messages || {}
        }
      >
        <FormProvider {...formMethods}>{children}</FormProvider>
      </ServerErrorsContext.Provider>
    </form>
  )
}

// Sorry about the `as` type assertion (type cast) here. Normally I'd redeclare
// forwardRef to only return a plain function, allowing us to use TypeScript's
// Higher-order Function Type Inference. But that gives us problems with the
// ForwardRefExoticComponent type we use for our InputComponents. So instead
// of changing that type (because it's correct) I use a type assertion here.
// forwardRef is notoriously difficult to use with UI component libs.
// Chakra-UI also says:
// > To be honest, the forwardRef type is quite complex [...] I'd recommend
// > that you cast the type
// https://github.com/chakra-ui/chakra-ui/issues/4528#issuecomment-902566185
const Form = forwardRef(FormInner) as <TFieldValues extends FieldValues>(
  props: FormProps<TFieldValues> & React.RefAttributes<HTMLFormElement>
) => React.ReactElement | null

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
 * `<FieldError>` doesn't render (i.e. returns `null`) when there's no error on `<TextField>`.
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
 * @see {@link https://redwoodjs.com/docs/tutorial/chapter3/forms#fielderror}
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
      emptyAs,

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
      ref,
      emptyAs
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
      emptyAs,

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
      ref,
      emptyAs
    )

    return (
      <select id={id || name} {...rest} {...styles} {...useRegisterReturn} />
    )
  }
)

export interface CheckboxFieldProps
  extends Omit<FieldProps<HTMLInputElement>, 'type' | 'emptyAs'>,
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

type InputType = (typeof INPUT_TYPES)[number]

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
      emptyAs,
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
      ref,
      emptyAs
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
  useErrorStyles,
  useRegister,
}

export type { ServerError, RWGqlError, ServerParseError } from './FormError'

export * from 'react-hook-form'
