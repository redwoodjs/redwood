import { useEffect } from 'react'
import { render, cleanup, fireEvent } from '@testing-library/react'
// TODO: Remove when jest configs are in place
import { toHaveClass } from '@testing-library/jest-dom/matchers'
expect.extend({ toHaveClass })

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
    expect(queryByTestId('comp-flash')).toBeNull()
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
    expect(queryByText(testMessages[0].text)).toBeNull()
    // view and dismiss the second message
    expect(msgTwo).toBeTruthy()
    fireEvent.click(btnTwo)
    expect(queryByText(testMessages[1].text)).toBeNull()
  })
})
