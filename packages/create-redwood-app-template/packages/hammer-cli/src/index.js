import path from 'path';
import React from 'react';
import { render, Box } from 'ink';

import { getCommands, parseArgs } from 'src/lib';
import { Header, CommandList } from 'src/components';

const Router = ({ commands, args = [] }) => {
  const commandToRun = args[0];
  const command = commands.find(({ commandProps: { name, alias } }) =>
    [name, alias].includes(commandToRun)
  );

  return (
    <Box flexDirection="column">
      {command ? (
        command.default({ args })
      ) : (
        <>
          <Header marginBottom={1} />
          <CommandList commands={commands} />
        </>
      )}
    </Box>
  );
};

if (process.env.NODE_ENV !== 'test') {
  render(<Router commands={getCommands()} args={parseArgs()} />);
}

export default Router;
