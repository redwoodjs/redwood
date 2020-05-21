# Request Handlers

At the moment we emulate AWS Lambda functions, but there are other serverless providers that have different request/ response signatures that we would like to support as a deploy target.

We think we have two approaches for making that possible:

- Converge on the AWS Lambda Functions format and convert "other" providers signatures at build time.
- Provide a way to emulate other function providers in the Redwood Function Server (Which is why this folder exists.)

We have not made a decision on which approach is better.
