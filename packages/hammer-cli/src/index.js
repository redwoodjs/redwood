import path from 'path';
import React from 'react';
import { render, Color, Text, Box } from 'ink';
import requireDir from 'require-dir';
import argv from 'yargs-parser';

import Header from 'src/components/Header';

export const getCommands = (cmdPath = './commands') => {
  return requireDir('./commands', {
    recurse: false,
    extensions: ['.js'],
  });
};

export const parseArgs = () => {
  return argv(process.argv.slice(2));
};

const CommandList = ({ commands }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold underline>
          Commands
        </Text>
      </Box>
      {Object.keys(commands).map(command => {
        const {
          commandProps: { description },
        } = commands[command];

        return (
          <Text key={command}>
            <Text bold> {command}</Text>
            {'    '}
            {description}
          </Text>
        );
      })}
    </Box>
  );
};

const MainMenu = ({ commands, args }) => {
  const command = args._[0];

  return (
    <Box flexDirection="column">
      <Header marginBottom={1} />
      {Object.keys(commands).includes(command) ? (
        commands[command].default({ args })
      ) : (
        <CommandList commands={commands} />
      )}
    </Box>
  );
};

render(<MainMenu commands={getCommands()} args={parseArgs()} />);
