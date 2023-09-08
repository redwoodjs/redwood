import { check } from 'k6'
import http from 'k6/http'
import { Counter } from 'k6/metrics'

const requestFailureCounter = new Counter('Request_Failures')

export const options = {
  stages: [
    { duration: '2s', target: 8 },
    { duration: '16s', target: 8 },
    { duration: '2s', target: 0 },
  ],
  thresholds: {
    Request_Failures: ['count<1'],
  },
}

// NOTE: Please ensure this is consistent with the number of models in the
//       setup script.
const modelCount = 1024

export default function () {
  const i = Math.floor(Math.random() * modelCount)
  const payload = (i) => {
    let query = `
    query ScalableGraphqlSchema {
      t${i}s {
        id
        typeName
        relation {
          id
          name
        }
      }
    }
  `

    return JSON.stringify({
      operationName: 'ScalableGraphqlSchema',
      query,
    })
  }

  const url = 'http://localhost:8911/graphql'
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const res = http.post(url, payload(i), params)

  const requestPassed = check(res, {
    'status was 200': (r) => r.status == 200,
    'content matched': (r) => r.body.includes(`"typeName":"T${i}"`),
  })
  if (!requestPassed) {
    requestFailureCounter.add(1)
  }
}
