const { DynamoDB } = require('aws-sdk');

exports.handler = async function(event, context) {
    try {
        const dynamoDB = new DynamoDB.DocumentClient();
        const userId = event.pathParameters.user;

        const params = {
          TableName: 'Balances',
          Key: {
            'user': userId
          }
        };
    
        const response = await dynamoDB.get(params).promise();
    
        if (!response.Item) {
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Balance not found' })
          };
        }
    
      
        return {
          statusCode: 200,
          body: JSON.stringify(response.Item)
        };
      } catch (error) {

        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error to get balanceUser' })
        };
      }
};

