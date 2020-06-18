import { render, fireEvent } from '@testing-library/react'
// TODO: Remove when jest configs are in place
import { toHaveClass } from '@testing-library/jest-dom/matchers'
expect.extend({ toHaveClass })

import { FlashProvider, useFlash } from 'src/flash/FlashContext'

const testMessages = {
  basic: { text: 'A basic message.', classes: 'last but-not-least', id: 0 },
  persisted: { text: 'A persisted message.', persist: true, id: 1 },
}

describe('<FlashProvider />', () => {
  const TestConsumer = () => {
    const { messages, addMessage, dismissMessage, cycleMessage } = useFlash()
    const cycleMessages = () => {
      for (let msg in testMessages) {
        cycleMessage(testMessages[msg].id)
      }
    }
    return (
      <>
        <h2>After these messages...</h2>
        {!!messages.length &&
          messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.classes}
              onClick={() => dismissMessage(msg.id)}
            >
              {msg.text}
            </div>
          ))}
        <button
          onClick={() =>
            addMessage(testMessages.basic.text, testMessages.basic)
          }
        >
          Add Basic Message
        </button>
        <button
          onClick={() =>
            addMessage(testMessages.persisted.text, testMessages.persisted)
          }
        >
          Add Persisted Message
        </button>
        <button onClick={() => cycleMessages()}>Cycle Messages</button>
      </>
    )
  }

  it('renders with children', () => {
    const { getByText } = render(
      <FlashProvider>
        <TestConsumer />
      </FlashProvider>
    )
    // render children
    expect(getByText(/After these messages.../)).toBeTruthy()
  })

  it('adds messages with classes and dismisses them', () => {
    const { getByText, queryByText } = render(
      <FlashProvider>
        <TestConsumer />
      </FlashProvider>
    )
    // add a message
    fireEvent.click(getByText(/Add Basic Message/))
    const basicMessage = getByText(testMessages.basic.text)
    expect(basicMessage).toBeTruthy()
    expect(basicMessage).toHaveClass(testMessages.basic.classes)
    // dismiss the message
    fireEvent.click(basicMessage)
    expect(queryByText(testMessages.basic.text)).toBeNull()
  })

  it('cycles messages correctly', () => {
    const { getByText, queryByText } = render(
      <FlashProvider>
        <TestConsumer />
      </FlashProvider>
    )
    // add a basic and persisted message
    fireEvent.click(getByText(/Add Basic Message/))
    fireEvent.click(getByText(/Add Persisted Message/))
    expect(getByText(testMessages.basic.text)).toBeTruthy()
    expect(getByText(testMessages.persisted.text)).toBeTruthy()
    // cycle the messages once (mark as viewed)
    const cycleButton = getByText(/Cycle Messages/)
    fireEvent.click(cycleButton)
    expect(getByText(testMessages.basic.text)).toBeTruthy()
    expect(getByText(testMessages.persisted.text)).toBeTruthy()
    // cycle the messages again (remove viewed)
    fireEvent.click(cycleButton)
    expect(queryByText(testMessages.basic.text)).toBeNull()
    // but persisted messages should... persist
    expect(getByText(testMessages.persisted.text)).toBeTruthy()
  })
})
