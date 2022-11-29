import { herokuHandler, herokuBuilder } from './modules/heroku'

// chck for windows ✅
// check for m1  ✅
// check if heroku is installed  ✅
// login to heroku ✅
// create project with desired opts
// configure config files in project
// deploy to heroku
// add commands to passthrough heroku cli

export const command = 'heroku'
export const description = 'Setup Heroku deployment'
export const builder = herokuBuilder
export const handler = herokuHandler
