import fs from 'fs';
import path from 'path';
import camelcase from 'camelcase';

const pascalCase = string => camelcase(string, { pascalCase: true });

const component = componentName => {
  return `import React from 'react'
import PropTypes from 'prop-types'

/**
 * This amazing component does...
 */
const ${componentName} = ({ as: Element = div, ...rest }) => {
  return <Element {...rest}>I am ${componentName}.</Element>;
};

ComponentName.propTypes = {}

export const queryProps = (args = {}) => ({
  query: gql\`query ${componentName}View {}\`,
  skeleton: () => null,
  ...args
});

export default ${componentName};
`;
};

const test = componentName => {
  return `
import React from 'react';
import { fireEvent, cleanup } from '@testing-library/react';

import ${componentName} from './';

describe('${componentName}', () => {

  afterEach(() => {
    cleanup()
  });

  it('this test will fail', () => {
    const component = renderComponent(ComponentName);
    component.debug();
    expect(true).toBe(false);
  })
})
`;
};

const mdx = componentName => {
  return `
import ${componentName} from './'

# ${componentName}

- [ ] Document the props/ types
- [ ] Allow user to play with the component
  `;
};

export default name => {
  const componentName = pascalCase(name);

  return {
    [`${componentName}/${componentName}.js`]: component(componentName),
    [`${componentName}/${componentName}.test.js`]: test(componentName),
    [`${componentName}/${componentName}.mdx`]: mdx(componentName),
  };
};
