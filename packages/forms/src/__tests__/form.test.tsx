import React from 'react'

import {
  toHaveFocus,
  toHaveClass,
  toBeInTheDocument,
} from '@testing-library/jest-dom/matchers'
import {
  screen,
  render,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
expect.extend({ toHaveFocus, toHaveClass, toBeInTheDocument })

import {
  Form,
  TextField,
  NumberField,
  CheckboxField,
  TextAreaField,
  DatetimeLocalField,
  DateField,
  SelectField,
  Submit,
  FieldError,
  Label,
} from '../index'

describe('Form', () => {
  const TestComponent = ({ onSubmit = () => {} }) => {
    return (
      <Form onSubmit={onSubmit}>
        <TextField name="text" defaultValue="text" />
        <NumberField name="number" defaultValue="42" />
        <TextField
          name="floatText"
          defaultValue="3.14"
          validation={{ valueAsNumber: true }}
        />
        <CheckboxField name="checkbox" defaultChecked={true} />
        <TextAreaField
          name="json"
          defaultValue={`
            {
              "key_one": "value1",
              "key_two": 2,
              "false": false
            }
          `}
          validation={{ valueAsJSON: true }}
        />
        <DatetimeLocalField
          name="datetimeLocal"
          defaultValue="2021-04-16T12:34"
        />
        <DateField name="date" defaultValue="2021-04-16" />
        <SelectField name="select1">
          <option>Option 1</option>
          <option>Option 2</option>
          <option>Option 3</option>
        </SelectField>
        <SelectField name="select2" validation={{ valueAsNumber: true }}>
          <option value={1}>Option 1</option>
          <option value={2}>Option 2</option>
          <option value={3}>Option 3</option>
        </SelectField>

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
          <TextField
            name="wrapped-ff"
            defaultValue="3.14"
            validation={{ valueAsNumber: true }}
          />
        </div>
        <NumberFieldsWrapper />
        <Submit>Save</Submit>
      </Form>
    )
  }

  const TestComponentWithRef = () => {
    const inputEl = React.useRef(null)
    React.useEffect(() => {
      inputEl.current.focus()
    })
    return (
      <Form>
        <TextField name="tf" defaultValue="text" ref={inputEl} />
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

  it('renders and coerces user-supplied values', async () => {
    const mockFn = jest.fn()

    render(<TestComponent onSubmit={mockFn} />)

    userEvent.type(screen.getByDisplayValue('text'), 'text')
    userEvent.type(screen.getByDisplayValue('42'), '24')
    userEvent.type(screen.getByDisplayValue('3.14'), '1592')
    fireEvent.change(screen.getByTestId('select1'), {
      target: { value: 'Option 2' },
    })
    fireEvent.change(screen.getByTestId('select2'), {
      target: { value: 3 },
    })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      {
        text: 'texttext',
        number: 4224, // i.e. NOT "4224"
        floatText: 3.141592,
        select1: 'Option 2',
        select2: 3,
        checkbox: true,
        json: {
          key_one: 'value1',
          key_two: 2,
          false: false,
        },
        datetimeLocal: new Date('2021-04-16T12:34'),
        date: new Date('2021-04-16'),
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

  it('supports ref forwarding', async () => {
    render(<TestComponentWithRef />)
    const input = screen.getByDisplayValue('text')

    await waitFor(() => {
      expect(input).toHaveFocus()
    })
  })

  it('lets users pass custom coercion functions', async () => {
    const mockFn = jest.fn()
    const coercionFunctionNumber = (value) =>
      parseInt(value.replace('_', ''), 10)
    const coercionFunctionText = (value) => value.replace('_', '-')

    render(
      <Form onSubmit={mockFn}>
        <TextField
          name="tf"
          defaultValue="123_456"
          validation={{ setValueAs: coercionFunctionNumber }}
        />
        <SelectField
          name="select"
          defaultValue="Option_2"
          validation={{ setValueAs: coercionFunctionText }}
        >
          <option>Option_1</option>
          <option>Option_2</option>
        </SelectField>
        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      { tf: 123456, select: 'Option-2' },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it('sets the value to undefined for empty string on optional relational fields', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        {/* This is an optional relational field because the name ends with "Id"
            and it doesn't have { required: true } */}
        <TextField name="userId" defaultValue="" />
        <SelectField name="groupId" defaultValue="">
          <option value="">No group</option>
          <option value={1}>Group 1</option>
          <option value={2}>Group 2</option>
        </SelectField>
        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      { userId: undefined, groupId: undefined },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it('ensures required textField is enforced by validation', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField
          name="userId2"
          defaultValue=""
          validation={{ required: true }}
        />
        <Submit>Save</Submit>
      </Form>
    )

    await act(async () => {
      fireEvent.submit(screen.getByText('Save'))
    })

    // The validation should catch and prevent the onSubmit from being called
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('ensures required selectField is enforced by validation', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <SelectField
          name="groupId2"
          defaultValue=""
          validation={{ required: true }}
        >
          <option value="">No group</option>
          <option value={1}>Group 1</option>
          <option value={2}>Group 2</option>
        </SelectField>
        <Submit>Save</Submit>
      </Form>
    )

    await act(async () => {
      fireEvent.submit(screen.getByText('Save'))
    })

    // The validation should catch and prevent the onSubmit from being called
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('handles int and float blank values gracefully', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <NumberField name="int" defaultValue="" />
        <TextField
          name="float"
          defaultValue=""
          validation={{ valueAsNumber: true }}
        />
        <Submit>Save</Submit>
      </Form>
    )
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      {
        int: NaN,
        float: NaN,
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  // Note the good JSON case is tested in an earlier test
  it('does not call the onSubmit function for a bad entry into a TextAreaField with valueAsJSON', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextAreaField
          name="jsonField"
          defaultValue="{bad-json}"
          validation={{ valueAsJSON: true }}
        />
        <Submit>Save</Submit>
      </Form>
    )
    await act(async () => {
      fireEvent.submit(screen.getByText('Save'))
    })

    // The validation should catch and prevent the onSubmit from being called
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('displays a FieldError for a bad entry into a TextAreaField with valueAsJSON', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextAreaField
          name="jsonField"
          defaultValue="{bad-json}"
          validation={{ valueAsJSON: true }}
        />
        <FieldError name="jsonField" data-testid="FieldError" />
        <Submit>Save</Submit>
      </Form>
    )
    //    await act(async () => {
    fireEvent.submit(screen.getByText('Save'))
    //    })
    await waitFor(() =>
      expect(screen.getByTestId('FieldError')).toBeInTheDocument()
    )

    // The validation should catch and prevent the onSubmit from being called
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('for a FieldError with name set to path', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField
          name="phone"
          defaultValue="abcde"
          validation={{ pattern: /^[0-9]+$/i }}
        />
        <FieldError name="phone" data-testid="phoneFieldError" />
        <TextField
          name="address.street"
          defaultValue="George123"
          validation={{ pattern: /^[a-zA-z]+$/i }}
          errorClassName="border-red"
        />
        <FieldError name="address.street" data-testid="streetFieldError" />
        <Submit>Save</Submit>
      </Form>
    )
    //    await act(async () => {
    fireEvent.submit(screen.getByText('Save'))
    //    })

    await waitFor(() =>
      expect(screen.getByTestId('phoneFieldError')).toBeInTheDocument()
    )
    // The validation should catch and prevent the onSubmit from being called
    expect(mockFn).not.toHaveBeenCalled()

    const phoneError = screen.getByTestId('phoneFieldError').textContent
    const streetError = screen.getByTestId('streetFieldError').textContent
    const streetField = screen.getByTestId('streetField')
    expect(phoneError).toEqual('phone is not formatted correctly')
    expect(streetError).toEqual('address.street is not formatted correctly')
    expect(streetField).toHaveClass('border-red', { exact: true })
  })

  it("doesn't crash on Labels without name", async () => {
    render(
      <Form>
        {/* @ts-expect-error - pretend this is a .js file */}
        <Label htmlFor="phone">Input your phone number</Label>
        <TextField
          id="phone"
          name="phone"
          defaultValue="abcde"
          validation={{ pattern: /^[0-9]+$/i }}
        />
        <FieldError name="phone" data-testid="phoneFieldError" />
        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    const phoneError = await waitFor(
      () => screen.getByTestId('phoneFieldError').textContent
    )
    expect(phoneError).toEqual('phone is not formatted correctly')
  })

  it('can handle falsy names ("false")', async () => {
    render(
      <Form>
        <TextField
          name="false"
          defaultValue="abcde"
          data-testid="phoneField"
          validation={{ pattern: /^[0-9]+$/i }}
        />
        <FieldError name="false" data-testid="phoneFieldError" />
        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    const phoneError = await waitFor(
      () => screen.getByTestId('phoneFieldError').textContent
    )
    expect(phoneError).toEqual('false is not formatted correctly')
  })

  it('can handle falsy names ("0")', async () => {
    render(
      <Form>
        <TextField
          name="0"
          defaultValue="abcde"
          validation={{ pattern: /^[0-9]+$/i }}
        />
        <FieldError name="0" data-testid="phoneFieldError" />
        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    const phoneError = await waitFor(
      () => screen.getByTestId('phoneFieldError').textContent
    )
    expect(phoneError).toEqual('0 is not formatted correctly')
  })

  it('Fields with emptyAs not defined return appropriate values', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField name="textField" />
        <TextField name="textAreaField" />
        <NumberField name="numberField" />
        <DateField name="dateField" />
        <SelectField name="selectField" defaultValue="">
          <option value="">No option selected</option>
          <option value={1}>Option 1</option>
          <option value={2}>Option 2</option>
          <option value={3}>Option 3</option>
        </SelectField>
        <CheckboxField name="checkboxField0" defaultChecked={false} />
        <CheckboxField name="checkboxField1" defaultChecked={true} />
        <TextAreaField
          name="jsonField"
          defaultValue=""
          validation={{ valueAsJSON: true }}
        />

        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      {
        textField: '',
        textAreaField: '',
        numberField: NaN,
        dateField: new Date(NaN),
        selectField: '',
        checkboxField0: false,
        checkboxField1: true,
        jsonField: null,
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it(`returns appropriate values for fields with emptyAs={'undefined'}`, async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField name="textField" emptyAs={'undefined'} />
        <TextAreaField name="textAreaField" emptyAs={'undefined'} />
        <NumberField name="numberField" emptyAs={'undefined'} />
        <DateField name="dateField" emptyAs={'undefined'} />
        <SelectField name="selectField" defaultValue="" emptyAs={'undefined'}>
          <option value="">No option selected</option>
          <option value={1}>Option 1</option>
          <option value={2}>Option 2</option>
          <option value={3}>Option 3</option>
        </SelectField>
        <TextAreaField
          name="jsonField"
          defaultValue=""
          validation={{ valueAsJSON: true }}
          emptyAs={'undefined'}
        />

        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      {
        textField: undefined,
        textAreaField: undefined,
        numberField: undefined,
        dateField: undefined,
        selectField: undefined,
        jsonField: undefined,
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it('returns null for empty values for fields with emptyAs={null}', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField name="textField" emptyAs={null} />
        <TextAreaField name="textAreaField" emptyAs={null} />
        <NumberField name="numberField" emptyAs={null} />
        <DateField name="dateField" emptyAs={null} />
        <SelectField name="selectField" defaultValue="" emptyAs={null}>
          <option value="">No option selected</option>
          <option value={1}>Option 1</option>
          <option value={2}>Option 2</option>
          <option value={3}>Option 3</option>
        </SelectField>
        <TextAreaField
          name="jsonField"
          defaultValue=""
          validation={{ valueAsJSON: true }}
          emptyAs={null}
        />

        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))
    expect(mockFn).toBeCalledWith(
      {
        textField: null,
        textAreaField: null,
        numberField: null,
        dateField: null,
        selectField: null,
        jsonField: null,
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it('returns appropriate value for empty values for fields with emptyAs={0}', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField name="textField" emptyAs={0} />
        <TextAreaField name="textAreaField" emptyAs={0} />
        <NumberField name="numberField" emptyAs={0} />
        <DateField name="dateField" emptyAs={0} />
        <SelectField name="selectField" defaultValue="" emptyAs={0}>
          <option value="">No option selected</option>
          <option value={1}>Option 1</option>
          <option value={2}>Option 2</option>
          <option value={3}>Option 3</option>
        </SelectField>
        <TextAreaField
          name="jsonField"
          defaultValue=""
          validation={{ valueAsJSON: true }}
          emptyAs={0}
        />

        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))

    expect(mockFn).toBeCalledWith(
      {
        textField: 0,
        textAreaField: 0,
        numberField: 0,
        dateField: 0,
        selectField: 0,
        jsonField: 0,
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it(`returns an empty string for empty values for a field with emptyAs={''}`, async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField name="textField" emptyAs={''} />
        <TextAreaField name="textAreaField" emptyAs={''} />
        <NumberField name="numberField" emptyAs={''} />
        <DateField name="dateField" emptyAs={''} />
        <SelectField name="selectField" defaultValue="" emptyAs={''}>
          <option value="">No option selected</option>
          <option value={1}>Option 1</option>
          <option value={2}>Option 2</option>
          <option value={3}>Option 3</option>
        </SelectField>
        <TextAreaField
          name="jsonField"
          defaultValue=""
          validation={{ valueAsJSON: true }}
          emptyAs={''}
        />

        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))

    expect(mockFn).toBeCalledWith(
      {
        textField: '',
        textAreaField: '',
        numberField: '',
        dateField: '',
        selectField: '',
        jsonField: '',
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it(`returns a NaN value for empty values for a field with emptyAs={'NaN'}`, async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField name="textField" emptyAs={'NaN'} />
        <TextAreaField name="textAreaField" emptyAs={'NaN'} />
        <NumberField name="numberField" emptyAs={'NaN'} />
        <DateField name="dateField" emptyAs={'NaN'} />
        <SelectField name="selectField" defaultValue="" emptyAs={'NaN'}>
          <option value="">No option selected</option>
          <option value={1}>Option 1</option>
          <option value={2}>Option 2</option>
          <option value={3}>Option 3</option>
        </SelectField>
        <TextAreaField
          name="jsonField"
          defaultValue=""
          validation={{ valueAsJSON: true }}
          emptyAs={'NaN'}
        />

        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))

    expect(mockFn).toBeCalledWith(
      {
        textField: NaN, // TBD - review if correct
        textAreaField: NaN,
        numberField: NaN,
        dateField: new Date(NaN),
        selectField: NaN,
        jsonField: '', // Exception: NaN is not applicable to be assigned to a json field
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it('should have appropriate validation for NumberFields and DateFields with emptyAs={null}', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <NumberField
          name="numberField"
          data-testid="numberField"
          emptyAs={null}
          validation={{ min: 10 }}
        />
        <DateField name="dateField" emptyAs={null} />
        <Submit>Save</Submit>
      </Form>
    )
    fireEvent.change(screen.getByTestId('numberField'), {
      target: { value: 2 },
    })
    await act(async () => {
      fireEvent.submit(screen.getByText('Save'))
    })

    // The validation should catch and prevent the onSubmit from being called
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('should return a number for a textfield with valueAsNumber, regardless of emptyAs', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField
          name="tf1"
          validation={{ valueAsNumber: true }}
          defaultValue="42"
        />
        <TextField
          name="tf2"
          validation={{ valueAsNumber: true }}
          defaultValue="42"
          emptyAs={'undefined'}
        />
        <TextField
          name="tf3"
          validation={{ valueAsNumber: true }}
          defaultValue="42"
          emptyAs={null}
        />
        <TextField
          name="tf4"
          validation={{ valueAsNumber: true }}
          defaultValue="42"
          emptyAs={'NaN'}
        />
        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))

    expect(mockFn).toBeCalledWith(
      {
        tf1: 42,
        tf2: 42,
        tf3: 42,
        tf4: 42,
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })

  it('should return a date for a textfield with valueAsDate, regardless of emptyAs', async () => {
    const mockFn = jest.fn()

    render(
      <Form onSubmit={mockFn}>
        <TextField
          name="tf1"
          validation={{ valueAsDate: true }}
          defaultValue="2022-02-01"
        />
        <TextField
          name="tf2"
          validation={{ valueAsDate: true }}
          defaultValue="2022-02-01"
          emptyAs={'undefined'}
        />
        <TextField
          name="tf3"
          validation={{ valueAsDate: true }}
          defaultValue="2022-02-01"
          emptyAs={null}
        />
        <TextField
          name="tf4"
          validation={{ valueAsDate: true }}
          defaultValue="2022-02-01"
          emptyAs={'NaN'}
        />
        <Submit>Save</Submit>
      </Form>
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1))

    expect(mockFn).toBeCalledWith(
      {
        tf1: new Date('2022-02-01'),
        tf2: new Date('2022-02-01'),
        tf3: new Date('2022-02-01'),
        tf4: new Date('2022-02-01'),
      },
      expect.anything() // event that triggered the onSubmit call
    )
  })
})
