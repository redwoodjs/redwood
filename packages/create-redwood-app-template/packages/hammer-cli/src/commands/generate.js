import React from 'react';
import { Text } from 'ink';

const Generate = () => {
  return <Text>I am the generate command.</Text>;
};

export const commandProps = {
  alias: 'g',
  description: 'save time by automatically generating boilerplate code',
};

export default Generate;
