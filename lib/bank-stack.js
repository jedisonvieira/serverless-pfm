const { RestApi, LambdaIntegration } = require("aws-cdk-lib/aws-apigateway");
const { DynamoEventSource } = require("@aws-cdk/aws-lambda-event-sources");
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

    const transactionFn = new Function(this, "Transaction", {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("lambda"),
      handler: "transaction.handler",
    });

    const api = new RestApi(this, "TransactionApi", {
      restApiName: "TransactionApi",
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

    const transactionsTable = new Table(this, "Transactions", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: "Transactions",
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_IMAGE,
    });

    transactionsTable.grantReadWriteData(transactionFn);

    sendToSQSFn.addEventSource(
      new DynamoEventSource(transactionsTable, {
        startingPosition: StartingPosition.LATEST,
      })
    );

    api.root
      .addResource("transactions")
      .addMethod("POST", new LambdaIntegration(transactionFn));
  }
}

module.exports = { BankStack };
