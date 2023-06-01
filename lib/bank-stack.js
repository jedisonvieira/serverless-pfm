const { RestApi, LambdaIntegration } = require("aws-cdk-lib/aws-apigateway");
const { DynamoEventSource } = require("@aws-cdk/aws-lambda-event-sources");
const { SqsEventSource } = require("aws-cdk-lib/aws-lambda-event-sources");
const { Stack, RemovalPolicy } = require("aws-cdk-lib");
const { Queue } = require("aws-cdk-lib/aws-sqs");
const { Duration } = require("@aws-cdk/core");
const {
  Table,
  AttributeType,
  StreamViewType,
} = require("aws-cdk-lib/aws-dynamodb");
const {
  Function,
  Runtime,
  Code,
  StartingPosition,
} = require("aws-cdk-lib/aws-lambda");

class BankStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    ///Create Tables
    const transactionsTable = new Table(this, "Transactions", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: "Transactions",
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_IMAGE,
    });

    const balanceTable = new Table(this, 'Balances', {
      partitionKey: {
        name: 'user',
        type: AttributeType.STRING,
      },
      tableName: 'Balances',
      removalPolicy: RemovalPolicy.DESTROY,
    });


    const transactionFn = new Function(this, "Transaction", {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("lambda"),
      handler: "transaction.handler",
    });

    const transactionsQueue = new Queue(this, "TransactionsQueue", {
      visibilityTimeout: Duration.seconds(300),
    });

    const sendToSQSFn = new Function(this, "SendToSQS", {
      runtime: Runtime.NODEJS_14_X,
      handler: "sendToSqs.handler",
      code: Code.fromAsset("lambda"),
      environment: {
        QUEUE_URL: transactionsQueue.queueUrl,
      },
    });

    transactionsQueue.grantSendMessages(sendToSQSFn);
    transactionsTable.grantReadWriteData(transactionFn);

    sendToSQSFn.addEventSource(
      new DynamoEventSource(transactionsTable, {
        startingPosition: StartingPosition.LATEST,
      })
    );

    const calculateBalanceFn = new Function(this, "CalculateBalance", {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("lambda"),
      handler: "setBalance.handler"
    });

    const getBalanceFn = new Function(this, 'GetBalances', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'getBalance.handler',
    });

    const getBalanceUserFn = new Function(this, 'GetBalanceUser', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'getBalanceByUser.handler',
    });

    balanceTable.grantReadWriteData(calculateBalanceFn);
    balanceTable.grantReadWriteData(getBalanceFn);
    balanceTable.grantReadWriteData(getBalanceUserFn);

    calculateBalanceFn.addEventSource(new SqsEventSource(transactionsQueue));

    const api = new RestApi(this, "BankApi", {
      restApiName: "BankApi",
    });

    const bank = api.root.addResource('bank');
    const transactions = bank.addResource("transactions");
    const balances = bank.addResource("balances");
    const balanceUser = balances.addResource('{user}');

    transactions.addMethod("POST", new LambdaIntegration(transactionFn));
    balances.addMethod("GET", new LambdaIntegration(getBalanceFn));
    balanceUser.addMethod("GET", new LambdaIntegration(getBalanceUserFn));
  }
}

module.exports = { BankStack };
