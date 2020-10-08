export type Custom = AuthClient

import { AuthClient } from './'

export const custom = (authClient: Omit<AuthClient, 'client'>) => authClient
