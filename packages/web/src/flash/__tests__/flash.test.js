import { useEffect } from 'react'

import { toHaveClass, toHaveStyle } from '@testing-library/jest-dom/matchers'
import { render, cleanup, fireEvent } from '@testing-library/react'
// TODO: Remove when jest configs are in place
expect.extend({ toHaveClass, toHaveStyle })

import Flash from 'src/flash/Flash'
import { FlashProvider, useFlash } from 'src/flash/FlashContext'

const testMessages = [
  { text: 'A basic message', classes: 'error' },
  { text: 'Another message', classes: 'success' },
]

describe('Flash', () => {
  const TestComponent = ({ messages, timeout }) => {
    const { addMessage } = useFlash()

    useEffect(() => {
      if (messages) {
        messages.forEach((msg) => addMessage(msg.text, msg))
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages])

    return <Flash timeout={timeout} />
  }

  afterEach(() => {
    cleanup()
  })

  it("doesn't crash", () => {
    expect(() => {
      render(
        <FlashProvider>
          <TestComponent />
        </FlashProvider>
      )
    }).not.toThrow()
  })

  it('renders null if there are no messages', () => {
    const { queryByTestId } = render(
      <FlashProvider>
        <TestComponent />
      </FlashProvider>
    )
    expect(queryByTestId('comp-flash')).not.toBeInTheDocument()
  })

  it('renders and displays messages with proper classes', () => {
    const { getByText, queryByTestId, queryAllByTestId } = render(
      <FlashProvider>
        <TestComponent messages={testMessages} />
      </FlashProvider>
    )
    expect(queryByTestId('flash')).toBeTruthy()
    expect(getByText(testMessages[0].text)).toBeTruthy()
    expect(queryAllByTestId('message')[0]).toHaveClass(testMessages[0].classes)
    expect(queryAllByTestId('message')[1]).toHaveClass(testMessages[1].classes)
  })

  it('supports styling messages with a style object', () => {
    const msg = [
      {
        text: 'A basic message',
        style: { backgroundColor: 'green', color: 'white' },
      },
    ]
    const { getByText, queryByTestId, queryAllByTestId } = render(
      <FlashProvider>
        <TestComponent messages={msg} />
      </FlashProvider>
    )
    expect(queryByTestId('flash')).toBeTruthy()
    expect(getByText(testMessages[0].text)).toBeTruthy()
    expect(queryAllByTestId('message')[0]).toHaveStyle(msg[0].style)
  })

  it('dismisses messages on close button click', () => {
    const { getByText, queryByText, getAllByTestId } = render(
      <FlashProvider>
        <TestComponent messages={testMessages} />
      </FlashProvider>
    )
    const btnOne = getAllByTestId('dismiss')[0]
    const btnTwo = getAllByTestId('dismiss')[1]
    const msgOne = getByText(testMessages[0].text)
    const msgTwo = getByText(testMessages[1].text)
    // view and dismiss the first message
    expect(msgOne).toBeTruthy()
    fireEvent.click(btnOne)
    expect(queryByText(testMessages[0].text)).not.toBeInTheDocument()
    // view and dismiss the second message
    expect(msgTwo).toBeTruthy()
    fireEvent.click(btnTwo)
    expect(queryByText(testMessages[1].text)).not.toBeInTheDocument()
  })
})
