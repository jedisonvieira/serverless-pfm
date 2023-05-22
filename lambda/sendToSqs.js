const AWS = require("aws-sdk");
const sqs = new AWS.SQS();

exports.handler = async function (event) {
  const records = event.Records;
  console.log("Event: ", JSON.stringify(event, null, 2));

  try {
    const sqs = new AWS.SQS();
    const queueUrl = process.env.QUEUE_URL;

    for (const record of records) {
      const transaction = record.dynamodb.NewImage;
      const transactionMessage = JSON.stringify(transaction);
      const params = {
        MessageBody: transactionMessage,
        QueueUrl: queueUrl,
      };

      await sqs.sendMessage(params).promise();
    }

    return {
      statusCode: 200,
      body: "Transactions sent to SQS successfully.",
    };
  } catch (error) {
    console.error("Error sending transactions to SQS:", error);
    console.log(error);
  }
};
