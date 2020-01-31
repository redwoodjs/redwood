import React from 'react'
import { Color, Text, Box } from 'ink'

import { version } from '../../package.json'

export default (props) => (
  <Box {...props}>
    <Color hex="#FFD900">
      <Text bold>Redwood</Text> - Bringing full-stack to the JAMstack.
      (https://redwoodjs.com)
    </Color>{' '}
    <Color hex="#999">| v{version}</Color>
  </Box>
)
