import { check } from 'k6'
import http from 'k6/http'
import { Counter } from 'k6/metrics'

const requestFailureCounter = new Counter('Request_Failures')
const contextErrorCounter = new Counter('Context_Errors')

export const options = {
  stages: [
    { duration: '1s', target: 8 },
    { duration: '6s', target: 8 },
    { duration: '1s', target: 0 },
  ],
  thresholds: {
    Request_Failures: ['count<1'],
    Context_Errors: ['count<1'],
  },
}

export default function () {
  const magicNumber = Math.floor(Math.random() * 16000000)

  const payload = (value) => {
    return JSON.stringify({
      query: `mutation MagicNumber($value: Int!) {
        magicNumber(value: $value) {
          value
        }
      }`,
      variables: {
        value,
      },
      operationName: 'MagicNumber',
    })
  }

  const url = `${__ENV.TEST_HOST}/graphql`
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const res = http.post(url, payload(magicNumber), params)

  const requestPassed = check(res, {
    'status was 200': (r) => r.status == 200,
  })
  if (!requestPassed) {
    requestFailureCounter.add(1)
  }

  const contextPassed = check(res, {
    'correct magic number': (r) =>
      r.body != null && r.body.includes(`"value":${magicNumber}}`),
  })
  if (!contextPassed) {
    contextErrorCounter.add(1)
  }
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
  }
}
