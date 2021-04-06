// import type { APIGatewayProxyEvent } from 'aws-lambda'

// import {
//   WEBHOOK_SIGNATURE_HEADER,
//   sign,
//   verifySignature,
//   verify,
//   WebhookVerificationError,
// } from './secureHandler'

// const body = 'No more secrets, Marty.'
// const secret = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

// describe('secureHandler', () => {
//   describe('signs a payload with default timestamp', () => {
//     test('it has a time and scheme', () => {
//       const signature = sign({ body, secret })
//       expect(signature).toMatch(/t=(\d+),v1=([\da-f]+)/)
//     })

//     test('it can verify a signature it generates', () => {
//       const signature = sign({ body, secret })
//       expect(verifySignature({ body, secret, signature })).toBeTruthy()
//     })

//     test('it denies a signature when signed with a different secret', () => {
//       const signature = sign({ body, secret: 'WERNER_BRANDES' })
//       expect(() => {
//         verifySignature({ body, secret, signature })
//       }).toThrow(WebhookVerificationError)
//     })
//   })

//   describe('signs a payload with varying timestamps and tolerances', () => {
//     test('it denies a signature when verifying with a short tolerance', () => {
//       const signature = sign({
//         body,
//         secret,
//         timestamp: Date.now() - 10 * 60 * 1000,
//       })
//       expect(() => {
//         verifySignature({
//           body,
//           secret,
//           signature,
//           options: { tolerance: 5000 },
//         })
//       }).toThrow(WebhookVerificationError)
//     })
//   })

//   describe('with an event', () => {
//     test('it validates the signature', () => {
//       const signature = sign({
//         body,
//         secret,
//       })

//       const event = { body, headers: {} } as APIGatewayProxyEvent
//       event.headers[WEBHOOK_SIGNATURE_HEADER.toLocaleLowerCase()] = signature

//       expect(verify({ event })).toBeTruthy()
//     })
//   })
// })
