import type {
  SupabaseAuthUser,
  SupabaseClient as Supabase,
} from '@supabase/supabase-js'

export type SupabaseUser = SupabaseAuthUser
export type { Supabase }

export function supabase(client: Supabase) {
  return {
    type: 'supabase',
    client,
    login: client.auth.login,
    logout: client.auth.logout,
    signup: client.auth.signup,
    getToken() {
      const supabaseJson = localStorage.getItem('supabase.auth.token')
      const supabaseData = supabaseJson ? JSON.parse(supabaseJson) : null
      return supabaseData?.accessToken || null
    },
    getUserMetadata: client.auth.user,
  }
}
