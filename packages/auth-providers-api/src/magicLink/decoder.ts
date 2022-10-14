import { Decoder } from '@redwoodjs/api'

export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'magicLink') {
    return null
  }

  const { MAGIC_SECRET_API_KEY } = process.env
  if (!MAGIC_SECRET_API_KEY) {
    throw new Error('MAGIC_SECRET_API_KEY environment variable not set.')
  }

  const { Magic } = require('@magic-sdk/admin')

  const magicAdmin = new Magic(MAGIC_SECRET_API_KEY)

  await magicAdmin.token.validate(token)
  const parsedDIDToken = magicAdmin.token.decode(token)
  // https://magic.link/docs/introduction/decentralized-id#what-is-a-did-token
  // The DID token is encoded as a Base64 JSON string tuple representing [proof, claim]:
  // proof: A digital signature that proves the validity of the given claim.
  // claim: Unsigned data the user asserts. This should equal the proof after Elliptic Curve recovery.
  //
  // import type { Claim } from '@magic-sdk/admin'
  // interface Claim {
  //   iat: number; // Issued At Timestamp
  //   ext: number; // Expiration Timestamp
  //   iss: string; // Issuer of DID Token
  //   sub: string; // Subject
  //   aud: string; // Audience
  //   nbf: number; // Not Before Timestamp
  //   tid: string; // DID Token ID
  //   add: string; // Encrypted signature of arbitrary data
  // }
  return {
    proof: parsedDIDToken[0], // proof: String
    claim: parsedDIDToken[1], // claim: Claim
  }
}
