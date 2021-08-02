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
  stages : [
    {duration: '2m', target : 100 }, 
    {duration: '5m', target : 100 }, 
    {duration: '2m', target : 200 }, 
    {duration: '5m', target : 200 }, 
    {duration: '2m', target : 300 }, 
    {duration: '5m', target : 300 }, 
    {duration: '2m', target : 400 }, 
    {duration: '5m', target : 400 }, 
    {duration: '10m', target : 0 }, //scale down recovery stage
  ]
  
};

export default function () {
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

  sleep(1);
}



export function handleSummary(data) {
    console.log('Preparing the end-of-test summary...');
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true}), // Show the text summary to stdout...
        'tests_summary/stresstest_summary.json': JSON.stringify(data), // and a JSON with all the details...
        // And any other JS transformation of the data you can think of,
        // you can write your own JS helpers to transform the summary data however you like!
    }
}
