/* eslint-env node, commonjs */

global.gql = require('graphql-tag')

const { context } = require('@redwoodjs/api')
global.context = context
