const body = `
<Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
<Form onSubmit={onSubmit} config={{ mode: 'onBlur' }} error={error}>
  <Label
    name="name"
    className="block text-gray-700 uppercase text-sm"
    errorClassName="block uppercase text-sm text-red-700"
  >
    Name
  </Label>
  <TextField
    name="name"
    validation={{ required: true }}
    className="border rounded-sm px-2 py-1 outline-none"
    errorClassName="border rounded-sm px-2 py-1 border-red-700 outline-none"
  />
  <FieldError name="name" className="block text-red-700" />

  <Label
    name="email"
    className="block mt-8 text-gray-700 uppercase text-sm"
    errorClassName="block mt-8 text-red-700 uppercase text-sm"
  >
    Email
  </Label>
  <TextField
    name="email"
    validation={{
      required: true,
      pattern: {
        value: /[^@]+@[^.]+\..+/,
        message: 'Please enter a valid email address',
      },
    }}
    className="border rounded-sm px-2 py-1"
    errorClassName="border rounded-sm px-2 py-1 border-red-700 outline-none"
  />
  <FieldError name="email" className="block text-red-700" />

  <Label
    name="message"
    className="block mt-8 text-gray-700 uppercase text-sm"
    errorClassName="block mt-8 text-red-700 uppercase text-sm"
  >
    Message
  </Label>
  <TextAreaField
    name="message"
    validation={{ required: true }}
    className="block border rounded-sm px-2 py-1"
    errorClassName="block border rounded-sm px-2 py-1 border-red-700 outline-none"
  />
  <FieldError name="message" className="block text-red-700" />

  <Submit className="block bg-blue-700 text-white mt-8 px-4 py-2 rounded" disabled={loading}>
    Save
  </Submit>
</Form>`

const functions = `const formMethods = useForm()

const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
  onCompleted: () => {
    toast.success('Thank you for your submission!')
    formMethods.reset()
  },
  onError: (error) => {
    toast.error(error.message)
  },
})

const onSubmit = (data) => {
  create({ variables: { input: data } })
  console.log(data)
}
`

const query = `const CREATE_CONTACT = gql\`
  mutation CreateContactMutation($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
\`
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const imports = [
    j.importDeclaration(
      [
        j.importSpecifier(j.identifier('Form'), j.identifier('Form')),
        j.importSpecifier(j.identifier('TextField'), j.identifier('TextField')),
        j.importSpecifier(
          j.identifier('TextAreaField'),
          j.identifier('TextAreaField')
        ),
        j.importSpecifier(j.identifier('Submit'), j.identifier('Submit')),
        j.importSpecifier(
          j.identifier('FieldError'),
          j.identifier('FieldError')
        ),
        j.importSpecifier(j.identifier('Label'), j.identifier('Label')),
      ],
      j.stringLiteral('@redwoodjs/forms')
    ),
    j.importDeclaration(
      [
        j.importSpecifier(
          j.identifier('useMutation'),
          j.identifier('useMutation')
        ),
      ],
      j.stringLiteral('@redwoodjs/web')
    ),
    j.importDeclaration(
      [
        j.importSpecifier(j.identifier('toast'), j.identifier('toast')),
        j.importSpecifier(j.identifier('Toaster'), j.identifier('Toaster')),
      ],
      j.stringLiteral('@redwoodjs/web/toast')
    ),
    j.importDeclaration(
      [j.importSpecifier(j.identifier('useForm'), j.identifier('useForm'))],
      j.stringLiteral('react-hook-form')
    ),
  ]

  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'Literal',
        value: '@redwoodjs/router',
      },
    })
    .remove()

  root
    .find(j.VariableDeclaration)
    .at(0)
    .insertBefore([...imports, query])

  root
    .find(j.ReturnStatement, {
      argument: {
        type: 'JSXFragment',
      },
    })
    .insertBefore(functions)

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'ContactPage',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body.body[1].argument.children = [body]
      return node
    })
    .toSource()
}
