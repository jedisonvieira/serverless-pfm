# AWS CDK Serverless personal finances manager

This project uses lambda functions to insert financial transactions and allow the user to consult his balance

## Usage examples
## * `Insert a new transaction:`
### POST: 'https://yourdomain.com/bank/transactions'
### Body:
#### Income
{
	"user": "junior",
	"type": "income",
	"value": 10
}
#### Expense
{
	"user": "junior",
	"type": "expense",
	"value": 5
}

## * `Check all balances:`
### GET: 'https://yourdomain.com/bank/balances'


## * `Check balance by user:`
### GET: 'https://yourdomain.com/bank/balances/{user}'


## Useful commands

* `npm run test`         perform the jest unit tests
* `npm run deploy`       deploy this stack to your default AWS account/region
* `cdk diff`             compare deployed stack with current state
* `cdk synth`            emits the synthesized CloudFormation template
* `npm run destoy`       remove this stack from your default AWS account
