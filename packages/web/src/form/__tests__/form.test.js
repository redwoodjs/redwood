import {
  screen,
  render,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  Form,
  TextField,
  NumberField,
  CheckboxField,
  TextAreaField,
  Submit,
} from 'src/form/form'

describe('Form', () => {
  const TestComponent = ({ onSubmit = () => {} }) => {
    return (
      <Form onSubmit={onSubmit}>
        <TextField name="tf" defaultValue="text" />
        <NumberField name="nf" defaultValue="42" />
        <TextField name="ff" defaultValue="3.14" dataType="Float" />
        <CheckboxField name="cf" defaultChecked={true} />
        <TextAreaField
          name="jf"
          dataType="Json"
          defaultValue={`
            {
              "key_one": "value1",
              "key_two": 2,
              "false": false
            }
          `}
        />
        <Submit>Save</Submit>
      </Form>
    )
  }

  const NumberFieldsWrapper = () => (
    <div>
      <h4>This is a wrapped form field header</h4>
      <div>
        <label htmlFor="wrapped-nf-1">Wrapped NumberField</label>
        <NumberField name="wrapped-nf-1" defaultValue="0101" />
      </div>
      <div>
        <label htmlFor="wrapped-nf-2">Wrapped NumberField</label>
        <NumberField name="wrapped-nf-2" defaultValue="0102" />
      </div>
    </div>
  )

  const TestComponentWithWrappedFormElements = ({ onSubmit = () => {} }) => {
    return (
      <Form onSubmit={onSubmit}>
        <p>Some text</p>
        <div className="field">
          <TextField name="wrapped-ff" defaultValue="3.14" dataType="Float" />
        </div>
        <NumberFieldsWrapper />
        <Submit>Save</Submit>
      </Form>
    )
  }

  afterEach(() => {
    cleanup()
  })

  it('does not crash', () => {
    expect(() => render(<TestComponent />)).not.toThrow()
  })

  it('calls onSubmit', async () => {
    const mockFn = jest.fn()

    render(<TestComponent onSubmit={mockFn} />)

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
  })

  it('coerces user-supplied values', async () => {
    const mockFn = jest.fn()

    render(<TestComponent onSubmit={mockFn} />)

    userEvent.type(screen.getByDisplayValue('text'), 'text')
    userEvent.type(screen.getByDisplayValue('42'), '24')
    userEvent.type(screen.getByDisplayValue('3.14'), '1592')
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      {
        tf: 'texttext',
        nf: 4224, // i.e. NOT "4224"
        ff: 3.141592,
        cf: true,
        jf: {
          key_one: 'value1',
          key_two: 2,
          false: false,
        },
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it('finds nested form fields to coerce', async () => {
    const mockFn = jest.fn()

    render(<TestComponentWithWrappedFormElements onSubmit={mockFn} />)

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      { 'wrapped-ff': 3.14, 'wrapped-nf-1': 101, 'wrapped-nf-2': 102 },
      expect.anything() // event that triggered the onSubmit call
    )
  })
})
