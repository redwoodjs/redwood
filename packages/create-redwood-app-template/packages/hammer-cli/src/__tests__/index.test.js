import React from 'react';
import { render } from 'ink-testing-library';

import Router from '../index';

describe('hammer-cli', () => {
  const commands = [
    {
      default: () => 'I am the a',
      commandProps: {
        name: 'command_a',
        alias: 'a',
        description: 'the cat was frightened by the loud sound',
      },
    },
    {
      default: () => 'I am the b',
      commandProps: {
        name: 'command_b',
        alias: 'b',
        description:
          "the sound of the tyres on the road roared above that of it's engine.",
      },
    },
  ];

  const renderComponent = props =>
    render(<Router commands={commands} args={undefined} {...props} />);

  it('the default menu is shown when no arguments are passed', () => {
    const { lastFrame } = renderComponent();
    expect(lastFrame()).toMatchSnapshot();
  });

  it('routes to the correct command when the name is matched ', () => {
    const { lastFrame } = renderComponent({
      args: { _: ['command_a'] },
    });
    expect(lastFrame()).toMatch(/I am the a/g);
  });
});
