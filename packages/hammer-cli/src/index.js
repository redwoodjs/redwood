import path from 'path';
import React from 'react';
import { render, Color, Text, Box } from 'ink';

import { getCommands, parseArgs } from 'src/lib';
import { Header, CommandList } from 'src/components';

const MainMenu = ({ commands, args }) => {
  const commandToRun = args._[0];
  const command = commands.find(({ commandProps: { name, alias } }) =>
    [name, alias].includes(commandToRun)
  );

  return (
    <Box flexDirection="column">
      <Header marginBottom={1} />
      {command ? (
        command.default({ args })
      ) : (
        <CommandList commands={commands} />
      )}
    </Box>
  );
};

if (process.env.NODE_ENV !== 'test') {
  render(<MainMenu commands={getCommands()} args={parseArgs()} />);
}
