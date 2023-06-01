
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
    console.log('Event: ', JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);
        const user = messageBody.user;
        const type = messageBody.type;
        const value = messageBody.value;

        const balance = getBalance(user);
        const newBalance = calculateBalance(balance, value, type);

        if (balance == null) {
            insertBalance(newBalance, user)
        } else {
            updateBalance(newBalance, user);
        }
    }
};

async function getBalance(user) {
    try {
        const params = {
            TableName: 'Balances',
            Key: {
                'user': user
            }
        };

        const response = await dynamodb.get(params).promise();

        if (!response.Item) {
            console.log('Balance not found.');
            return null;
        }

        return response.Item;
    } catch (error) {
        console.error('Error finding item:', error);
    }
}

async function calculateBalance(balance, value, type) {
    if (balance == null) balance = { balance: 0 };
    const transactionValue = parseFloat(value);

    if (type == 'income') transactionValue *= -1;

    const newBalance = parseFloat(balance.balance) + transactionValue;
    return newBalance;

}

async function updateBalance(balance, user) {
    try {
        const params = {
            TableName: 'Balances',
            Key: {
                'user': user
            },
            UpdateExpression: 'SET balance = :balance',
            ExpressionAttributeValues: {
                ':balance': balance
            }
        };

        await dynamodb.update(params).promise();

        console.log('Balance updated');

    } catch (error) {
        console.error('Error update balance:', error);
    }
}

async function insertBalance(balance, user) {
    try {
        const data = await dynamodb.put({
            TableName: 'Balances',
            Item: {
                user: user,
                balance: balance,
            },
        }).promise();
        console.log("Inserted balance into DynamoDB table");
    } catch (error) {
        console.error(`Error inserting balance into DynamoDB table: ${error}`);
    }
}
