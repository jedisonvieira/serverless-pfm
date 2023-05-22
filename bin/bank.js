#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { BankStack } = require('../lib/bank-stack');

const app = new cdk.App();
new BankStack(app, 'BankStack', {
  
});
