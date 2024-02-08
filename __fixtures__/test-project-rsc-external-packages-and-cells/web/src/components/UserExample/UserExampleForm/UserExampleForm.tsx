import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  Submit,
} from '@redwoodjs/forms'

import type { EditUserExampleById, UpdateUserExampleInput } from 'types/graphql'
import type { RWGqlError } from '@redwoodjs/forms'

type FormUserExample = NonNullable<EditUserExampleById['userExample']>

interface UserExampleFormProps {
  userExample?: EditUserExampleById['userExample']
  onSave: (data: UpdateUserExampleInput, id?: FormUserExample['id']) => void
  error: RWGqlError
  loading: boolean
}

const UserExampleForm = (props: UserExampleFormProps) => {
  const onSubmit = (data: FormUserExample) => {
    props.onSave(data, props?.userExample?.id)
  }

  return (
    <div className="rw-form-wrapper">
      <Form<FormUserExample> onSubmit={onSubmit} error={props.error}>
        <FormError
          error={props.error}
          wrapperClassName="rw-form-error-wrapper"
          titleClassName="rw-form-error-title"
          listClassName="rw-form-error-list"
        />

        <Label
          name="email"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Email
        </Label>

        <TextField
          name="email"
          defaultValue={props.userExample?.email}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="email" className="rw-field-error" />

        <Label
          name="name"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Name
        </Label>

        <TextField
          name="name"
          defaultValue={props.userExample?.name}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
        />

        <FieldError name="name" className="rw-field-error" />

        <div className="rw-button-group">
          <Submit disabled={props.loading} className="rw-button rw-button-blue">
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default UserExampleForm
