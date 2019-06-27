import React from 'react';
import { Text, Box } from 'ink';

const CommandList = ({ commands }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold underline>
          Commands
        </Text>
      </Box>

      {commands.map(({ commandProps: { name, description } }) => {
        return (
          <Box key={`command-${name}`}>
            <Box justifyContent="flex-end" marginX={1}>
              <Box>
                <Text bold>{name}</Text>
              </Box>
            </Box>
            <Box flex={1}>{description}</Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default CommandList;
