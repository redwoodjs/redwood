import path from 'path';
import React from 'react';
import { render, Color, Text, Box } from 'ink';
import requireDir from 'require-dir';

import Header from 'src/components/Header';

// TODO: Show this menu if an unknown command was passed.
// TODO: Route to the executed command.
const MainMenu = () => {
  const commands = requireDir('./commands', {
    recurse: false,
    extensions: ['.js'],
  });

  return (
    <Box flexDirection="column">
      <Header />
      <Box flexDirection="column">
        <Box paddingY={1} bold>
          Commands
        </Box>
        {Object.keys(commands).map(command => {
          return (
            <Text key={command}>
              <Text bold> {command}</Text>
              {'    '}
              {commands[command].description}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
};

render(<MainMenu />);
