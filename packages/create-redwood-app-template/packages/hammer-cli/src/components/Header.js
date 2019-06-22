import React from 'react';
import { Color, Text, Box } from 'ink';

import { version } from '../../package.json';

export default () => (
  <Box>
    <Color hex="#FFD900">
      <Text bold>⚒ Hammer</Text> - Build something. (https://example.org)
    </Color>{' '}
    <Color hex="#999">(v{version})</Color>
  </Box>
);
