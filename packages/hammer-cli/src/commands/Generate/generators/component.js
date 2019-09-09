import camelcase from 'camelcase'

const pascalCase = (string) => camelcase(string, { pascalCase: true })

const component = (componentName) => {
  return `
/**
 * This amazing component does...
 */
const ${componentName} = (props) => {
  return <div>I am ${componentName}.</div>;
};

${componentName}.propTypes = {}

${componentName}.queryProps = {
  query: gql\`query ${componentName}Query {}\`,
  skeleton: undefined,
  dataToProps: (data) => data,
};

export default ${componentName};
`
}

const test = (componentName) => {
  return `
import React from 'react';
import { fireEvent, cleanup } from '@testing-library/react';

import ${componentName} from './';

describe('${componentName}', () => {

  afterEach(() => {
    cleanup()
  });

  it('this test will fail', () => {
    const component = renderComponent(<${componentName} />);
    component.debug();
    expect(true).toBe(false);
  })
})
`
}

const mdx = (componentName) => {
  return `
import ${componentName} from './'

# ${componentName}

- [ ] Document the props/ types
- [ ] Allow user to play with the component
  `
}

export default (name) => {
  const componentName = pascalCase(name)

  return {
    [`${componentName}/${componentName}.js`]: component(componentName),
    [`${componentName}/${componentName}.test.js`]: test(componentName),
    [`${componentName}/${componentName}.mdx`]: mdx(componentName),
  }
}
