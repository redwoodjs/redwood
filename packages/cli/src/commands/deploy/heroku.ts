import { herokuHandler, herokuBuilder } from './modules/heroku'

export const command = 'heroku'
export const description = 'Setup Heroku deployment'
export const builder = herokuBuilder
export const handler = herokuHandler
