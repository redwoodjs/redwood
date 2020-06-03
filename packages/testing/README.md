# @RedwoodJS/Testing

<!-- toc -->
- [Purpose and Vision](#Purpose-and-Vision)
- [Package Lead](#Package-Lead)
- [Roadmap](#Roadmap)
- [Contributing](#Contributing)

## Purpose and Vision

This package provides helpful defaults when testing a Redwood project's web side. The core of the project is an re-export of `@testing-library/react` with a custom `render` method.

## Usage

In a jest test:
```js
import { render, screen } from '@redwoodjs/testing

it('works as expected', () => {
  render(<MyComponent />)
  expect(screen.queryByText('Text in my component')).toBeInTheDocument()
}
```

## Package Lead
- [@RobertBroersma](https://github.com/RobertBroersma)
- [@peterp](https://github.com/peterp)

## Roadmap
See [[Testing] Support Jest --config extensibility](https://github.com/redwoodjs/redwood/issues/564)

## Contributing
Core technologies
- [Jest](https://jestjs.io/docs/en/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)