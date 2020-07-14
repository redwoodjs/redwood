import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  CheckboxField,
  NumberField,
  TextAreaField,
  Submit,
} from '@redwoodjs/web'

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
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Title
        </Label>
        <TextField
          name="title"
          defaultValue={props.post?.title}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />
        <FieldError name="title" className="rw-field-error" />

        <Label
          name="slug"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Slug
        </Label>
        <TextField
          name="slug"
          defaultValue={props.post?.slug}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />
        <FieldError name="slug" className="rw-field-error" />

        <Label
          name="author"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Author
        </Label>
        <TextField
          name="author"
          defaultValue={props.post?.author}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />
        <FieldError name="author" className="rw-field-error" />

        <Label
          name="body"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Body
        </Label>
        <TextField
          name="body"
          defaultValue={props.post?.body}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />
        <FieldError name="body" className="rw-field-error" />

        <Label
          name="image"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Image
        </Label>
        <TextField
          name="image"
          defaultValue={props.post?.image}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />
        <FieldError name="image" className="rw-field-error" />

        <Label
          name="isPinned"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Is pinned
        </Label>
        <CheckboxField
          name="isPinned"
          defaultChecked={props.post?.isPinned}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
        />
        <FieldError name="isPinned" className="rw-field-error" />

        <Label
          name="readTime"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Read time
        </Label>
        <NumberField
          name="readTime"
          defaultValue={props.post?.readTime}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />
        <FieldError name="readTime" className="rw-field-error" />

        <Label
          name="rating"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Rating
        </Label>
        <TextField
          name="rating"
          defaultValue={props.post?.rating}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
          dataType="Float"
        />
        <FieldError name="rating" className="rw-field-error" />

        <Label
          name="postedAt"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Posted at
        </Label>
        <TextField
          name="postedAt"
          defaultValue={props.post?.postedAt}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />
        <FieldError name="postedAt" className="rw-field-error" />

        <Label
          name="metadata"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Metadata
        </Label>
        <TextAreaField
          name="metadata"
          defaultValue={JSON.stringify(props.post?.metadata)}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
          dataType="Json"
        />
        <FieldError name="metadata" className="rw-field-error" />

        <div className="rw-button-group">
          <Submit disabled={props.loading} className="rw-button rw-button-blue">
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default PostForm
