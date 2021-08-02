import http from 'k6/http';
import { sleep, check } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Import browserified AWSv4 signature library
import aws4 from './aws4.js';
// Get AWS credentials from environment variables
const AWS_CREDS = {
  accessKeyId: 'YOUR_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
};
const ENDPOINT_NAME = 'YOUR_ENDPOINT_NAME'
const REGION = 'YOUR_REGION'

export let options = {
  thresholds: {
    'http_req_failed{scenario_tag: 200_RPS}': ['rate<0.01'],   // http errors should be less than 1% 
    'http_req_duration{scenario_tag: 200_RPS}': ['p(95)<200'], // 95% of requests should be below 200ms
    'http_req_failed{scenario_tag: 800_RPS}': ['rate<0.01'],    
    'http_req_duration{scenario_tag: 800_RPS}': ['p(95)<200'], 
    'http_req_failed{scenario_tag: 1600_RPS}': ['rate<0.01'],    
    'http_req_duration{scenario_tag: 1600_RPS}': ['p(95)<200'], 
  },

  scenarios: {
    constant_request_rate_0: {
      executor: 'constant-arrival-rate',
      exec: 'shortMessage',
      rate: 200,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      tags: { scenario_tag: '200_RPS' },
    },
    constant_request_rate_1: {
      executor: 'constant-arrival-rate',
      exec: 'shortMessage',
      rate: 800,
      timeUnit: '1s',
      duration: '1m',
      startTime: '1m',
      preAllocatedVUs: 100,
      maxVUs: 400,
      tags: { scenario_tag: '800_RPS' },
    },
    constant_request_rate_2: {
      executor: 'constant-arrival-rate',
      exec: 'shortMessage',
      rate: 1600,
      timeUnit: '1s',
      duration: '2m',
      startTime: '2m',
      preAllocatedVUs: 100,
      maxVUs: 600,
      tags: { scenario_tag: '1600_RPS' },
    },
  },
};

export function shortMessage() {
  const sig = aws4.sign(
    {
      host: `runtime.sagemaker.${REGION}.amazonaws.com`,
      service: 'sagemaker',
      path: `/endpoints/${ENDPOINT_NAME}/invocations`,
      region: REGION,
      body: JSON.stringify({ query: 'hello world !' }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    AWS_CREDS,
  );

  // Send the request
  const url = `https://${sig.host}${sig.path}`;
  let res = http.post(url, sig.body, {
    headers: sig.headers,
  });
  // Verify response
  check(res, {
    'status is 200': (r) => r.status === 200,
    'reponse has JSON key "embedding"': (r) => JSON.parse(r.body).embedding !== undefined,
  });

}



export function handleSummary(data) {
    console.log('Preparing the end-of-test summary...');
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true}), // Show the text summary to stdout...
        'tests_summary/spiketest_summary.json': JSON.stringify(data), // and a JSON with all the details...
        // And any other JS transformation of the data you can think of,
        // you can write your own JS helpers to transform the summary data however you like!
    }
}
