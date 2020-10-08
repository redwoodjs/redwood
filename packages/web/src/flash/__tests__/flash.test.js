import { useEffect } from 'react'

import { toHaveClass, toHaveStyle } from '@testing-library/jest-dom/matchers'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
// TODO: Remove when jest configs are in place
expect.extend({ toHaveClass, toHaveStyle })

import Flash from '../Flash'
import { FlashProvider, useFlash } from '../FlashContext'

const testMessages = [
  { text: 'A basic message', classes: 'error' },
  { text: 'Another message', classes: 'success' },
]

describe('useFlash', () => {
  it('throws Error when not called in FlashContext', () => {
    expect(renderHook(() => useFlash()).result.error).toEqual(
      Error('`useFlash` can only be used inside a `FlashProvider`')
    )
  })
})

describe('Flash', () => {
  const TestComponent = ({ messages, timeout }) => {
    const { addMessage } = useFlash()

    useEffect(() => {
      if (messages) {
        messages.forEach((msg) => addMessage(msg.text, msg))
      }
    }, [addMessage, messages])

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
    expect(queryByText(testMessages[0].text)).toBeNull()
    // view and dismiss the second message
    expect(msgTwo).toBeTruthy()
    fireEvent.click(btnTwo)
    expect(queryByText(testMessages[1].text)).toBeNull()
  })
})
