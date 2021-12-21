var aws = require('aws-sdk')

var ddb = new aws.DynamoDB.DocumentClient({
        accessKeyId: 'AKIAYIHNXSALZ7JQGRHM',//process.env.accessKey,
      secretAccessKey: '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',//process.env.secretAccessKey,
      region: 'us-east-1'
})

module.exports = ddb;

