/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { createCell } from './createCell'
import { GraphQLHooksProvider } from './GraphQLHooksProvider'

describe('createCell', () => {
  test('Renders a static Success component', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: () => <>Great success!</>,
    })

    const myUseQueryHook = () => ({ data: {} })

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )
    screen.getByText(/^Great success!$/)
  })

  test('Renders Success with data', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: ({ answer }) => (
        <>
          <dl>
            <dt>What&apos;s the meaning of life?</dt>
            <dd>{answer}</dd>
          </dl>
        </>
      ),
    })

    const myUseQueryHook = () => {
      return { data: { answer: 42 } }
    }

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )

    screen.getByText(/^What's the meaning of life\?$/)
    screen.getByText(/^42$/)
  })

  test('Renders default Loading when there is no data', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: () => <>Great success!</>,
    })

    const myUseQueryHook = () => ({ loading: true })

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )
    screen.getByText(/^Loading...$/)
  })

  test('Renders custom Loading when there is no data', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: () => <>Great success!</>,
      Loading: () => <>Fetching answer...</>,
    })

    const myUseQueryHook = () => ({ loading: true })

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )
    screen.getByText(/^Fetching answer...$/)
  })

  test('Renders Success even when `loading` is true if there is data', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: () => <>Great success!</>,
      Loading: () => <>Fetching answer...</>,
    })

    const myUseQueryHook = () => ({ loading: true, data: {} })

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )
    screen.getByText(/^Great success!$/)
  })

  test('Renders Empty if available, and data field is null', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: () => <>Great success!</>,
      Empty: () => <>No one knows</>,
    })

    const myUseQueryHook = () => ({ loading: true, data: { answer: null } })

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )
    screen.getByText(/^No one knows$/)
  })

  test('Renders Empty if available, and data field is an empty array', async () => {
    const TestCell = createCell({
      // @ts-expect-error - Purposefully using a plain string here.
      QUERY: 'query TestQuery { answer }',
      Success: () => <>Great success!</>,
      Empty: () => <>No one knows</>,
    })

    const myUseQueryHook = () => ({ loading: true, data: { answers: [] } })

    render(
      <GraphQLHooksProvider useQuery={myUseQueryHook} useMutation={null}>
        <TestCell />
      </GraphQLHooksProvider>
    )
    screen.getByText(/^No one knows$/)
  })
})
