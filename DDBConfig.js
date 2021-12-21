var aws = require('aws-sdk')

var ddb = new aws.DynamoDB.DocumentClient({
        accessKeyId: process.env.accessKey,
      secretAccessKey: process.env.secretAccessKey,
      region: 'us-east-1'
})

module.exports = ddb;

