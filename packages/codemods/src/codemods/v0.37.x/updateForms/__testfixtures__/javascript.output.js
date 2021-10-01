const BazingaForm = ({ onSubmit = () => {} }) => {
  return (
    <Form onSubmit={onSubmit} config={{ mode: 'onBlur' }}>
      <TextField
        name="floatText"
        defaultValue="3.14"
        validation={{
          required: true,
          valueAsNumber: true,
        }}
      />
      <TextAreaField
        name="json"
        defaultValue={`
          {
            "key_one": "value1",
            "key_two": 2,
            "false": false
          }
        `}
        validation={{
          valueAsJSON: true,
        }}
      />
      <SelectField
        name="select2"
        data-testid="select2"
        validation={{
          valueAsNumber: true,
        }}
      >
        <option value={1}>Option 1</option>
        <option value={2}>Option 2</option>
        <option value={3}>Option 3</option>
      </SelectField>
    </Form>
  )
}
