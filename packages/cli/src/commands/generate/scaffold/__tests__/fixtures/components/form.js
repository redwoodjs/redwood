import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  Submit,
} from '@redwoodjs/web'

const CSS = {
  label: 'rw-label',
  labelError: 'rw-label rw-label-error',
  input: 'rw-input',
  inputError: 'rw-input rw-input-error',
  errorMessage: 'rw-field-error',
}

const PostForm = (props) => {
  const onSubmit = (data) => {
    props.onSave(data, props?.post?.id)
  }

  return (
    <div className="rw-form-wrapper">
      <Form onSubmit={onSubmit} error={props.error}>
        <FormError
          error={props.error}
          wrapperClassName="rw-form-error-wrapper"
          titleClassName="rw-form-error-title"
          listClassName="rw-form-error-list"
        />

        <Label
          name="title"
          className={CSS.label}
          errorClassName={CSS.labelError}
        >
          Title
        </Label>
        <TextField
          name="title"
          defaultValue={props.post?.title}
          className={CSS.input}
          errorClassName={CSS.inputError}
          validation={{ required: true }}
        />
        <FieldError name="title" className={CSS.errorMessage} />

        <Label
          name="slug"
          className={CSS.label}
          errorClassName={CSS.labelError}
        >
          Slug
        </Label>
        <TextField
          name="slug"
          defaultValue={props.post?.slug}
          className={CSS.input}
          errorClassName={CSS.inputError}
          validation={{ required: true }}
        />
        <FieldError name="slug" className={CSS.errorMessage} />

        <Label
          name="author"
          className={CSS.label}
          errorClassName={CSS.labelError}
        >
          Author
        </Label>
        <TextField
          name="author"
          defaultValue={props.post?.author}
          className={CSS.input}
          errorClassName={CSS.inputError}
          validation={{ required: true }}
        />
        <FieldError name="author" className={CSS.errorMessage} />

        <Label
          name="body"
          className={CSS.label}
          errorClassName={CSS.labelError}
        >
          Body
        </Label>
        <TextField
          name="body"
          defaultValue={props.post?.body}
          className={CSS.input}
          errorClassName={CSS.inputError}
          validation={{ required: true }}
        />
        <FieldError name="body" className={CSS.errorMessage} />

        <Label
          name="image"
          className={CSS.label}
          errorClassName={CSS.labelError}
        >
          Image
        </Label>
        <TextField
          name="image"
          defaultValue={props.post?.image}
          className={CSS.input}
          errorClassName={CSS.inputError}
          validation={{ required: true }}
        />
        <FieldError name="image" className={CSS.errorMessage} />

        <Label
          name="postedAt"
          className={CSS.label}
          errorClassName={CSS.labelError}
        >
          Posted at
        </Label>
        <TextField
          name="postedAt"
          defaultValue={props.post?.postedAt}
          className={CSS.input}
          errorClassName={CSS.inputError}
          validation={{ required: true }}
        />
        <FieldError name="postedAt" className={CSS.errorMessage} />

        <div className="rw-button-group">
          <Submit
            disabled={props.loading}
            className="rw-button rw-button-blue"
          >
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default PostForm
