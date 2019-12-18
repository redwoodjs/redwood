import pascalcase from 'pascalcase'

const name = "Component"
const command = "component"
const description = "Generates a React component"

const output = args => {
  const [_commandName, _generatorName, componentName, ...rest] = args
  const name = pascalcase(componentName)
  const path = `components/${name}/${name}`

  const component = `
/**
 * This amazing component does...
 */
const ${name} = (props) => {
  return <div>I am ${name}.</div>;
};

${name}.propTypes = {}

${name}.queryProps = {
  query: gql\`query ${name}Query {}\`,
  skeleton: undefined,
  dataToProps: (data) => data,
};

export default ${name};
`

  const test = `
import React from 'react';
import { fireEvent, cleanup } from '@testing-library/react';

import ${name} from './';

describe('${name}', () => {

  afterEach(() => {
    cleanup()
  });

  it('this test will fail', () => {
    const component = renderComponent(<${name} />);
    component.debug();
    expect(true).toBe(false);
  })
})
`

  const mdx = `
import ${name} from './'

# ${name}

- [ ] Document the props/ types
- [ ] Allow user to play with the component
`

  return {
    [`${path}.js`]: component,
    [`${path}.test.js`]: test,
    [`${path}.mdx`]: mdx,
  }
}

export default {
  name,
  command,
  description,
  files: nameArg => output(nameArg)
}
