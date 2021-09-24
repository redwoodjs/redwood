const BazingaForm = ({ onSubmit = () => {} }) => {
  return (
    <Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
      <TextField name="floatText" defaultValue="3.14" transformValue="Float" />
      <TextAreaField
        name="json"
        transformValue="Json"
        defaultValue={`
          {
            "key_one": "value1",
            "key_two": 2,
            "false": false
          }
        `}
      />
      <SelectField name="select2" data-testid="select2" transformValue="Int">
        <option value={1}>Option 1</option>
        <option value={2}>Option 2</option>
        <option value={3}>Option 3</option>
      </SelectField>
    </Form>
  )
}
