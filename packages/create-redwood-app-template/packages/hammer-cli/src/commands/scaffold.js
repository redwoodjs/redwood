import React from 'react';
import { Text } from 'ink';

const Scaffold = () => {
  return <Text>I am the Scaffold command.</Text>;
};

export const commandProps = {
  alias: '',
  description: 'auto generate a set of files for rapid development',
};

export default Scaffold;
