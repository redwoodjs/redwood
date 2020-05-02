import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  Submit,
} from '@redwoodjs/web'

const CSS = {
  label: 'block mt-6 text-gray-700 font-semibold',
  labelError: 'block mt-6 font-semibold text-red-700',
  input:
    'block mt-2 w-full p-2 border border-gray-300 text-gray-700 rounded focus:outline-none focus:border-gray-500',
  inputError:
    'block mt-2 w-full p-2 border border-red-700 text-red-900 rounded focus:outline-none',
  errorMessage: 'block mt-1 font-semibold uppercase text-xs text-red-700',
}

const PostForm = (props) => {
  const onSubmit = (data) => {
    props.onSave(data, props?.post?.id)
  }

  return (
    <div className="box-border text-sm -mt-4">
      <Form onSubmit={onSubmit} error={props.error}>
        <FormError
          error={props.error}
          wrapperClassName="p-4 bg-red-100 text-red-700 border border-red-300 rounded mt-4 mb-4"
          titleClassName="mt-0 font-semibold"
          listClassName="mt-2 list-disc list-inside"
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

        <div className="mt-8 text-center">
          <Submit
            disabled={props.loading}
            className="bg-blue-600 text-white hover:bg-blue-700 text-xs rounded px-4 py-2 uppercase font-semibold tracking-wide"
          >
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default PostForm
