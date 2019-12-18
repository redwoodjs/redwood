import pascalcase from 'pascalcase'

const name = "component"
const description = "Generates a React component"

const output = nameArg => {
  const name = pascalcase(nameArg)
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

  return ({
    [`components/${name}/${name}.js`]: component,
    [`components/${name}/${name}.test.js`]: test,
    [`components/${name}/${name}.mdx`]: mdx
  })
}

export default {
  name,
  description,
  files: nameArg => output(nameArg)
}
