import { netlify } from './netlify'
import { auth0 } from './auth0'
import { goTrue } from './goTrue'
import { magicLink } from './magicLink'
import { firebase } from './firebase'
import { supabase } from './supabase'
import { custom } from './custom'

export default {
  netlify,
  auth0,
  goTrue,
  magicLink,
  firebase,
  supabase,
  /** Don't we support your auth client? No problem, define your own the `custom` type! */
  custom,
}
