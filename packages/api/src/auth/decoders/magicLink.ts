// Relevant type excerpt from Magiclink's magic-sdk/admin:
// export interface Claim {
//   iat: number; // Issued At Timestamp
//   ext: number; // Expiration Timestamp
//   iss: string; // Issuer of DID Token
//   sub: string; // Subject
//   aud: string; // Audience
//   nbf: number; // Not Before Timestamp
//   tid: string; // DID Token ID
//   add: string; // Encrypted signature of arbitrary data
// }
// export type ParsedDIDToken = [string, Claim];
//
// This function validates the token, throw an error if validations fails
// otherwise it will return the decoded token in the form of a ParsedDIDToken
export const magicLink = async (token: string):  => {
  const { MAGIC_SECRET_API_KEY } = process.env
  if (!MAGIC_SECRET_API_KEY) {
    throw new Error('`MAGIC_SECRET_API_KEY` environment variable not set.')
  }
  const { Magic } = require('@magic-sdk/admin')

  const magicAdmin = new Magic(MAGIC_SECRET_API_KEY)

  magicAdmin.token.validate(token)

  return magicAdmin.token.decode(token)

}

