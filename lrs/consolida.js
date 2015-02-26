var async = require('async');
var util = require("util");

var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials();
var config = require('./config/settings').settings;

AWS.config.credentials = credentials;
AWS.config.update({region: config.aws_region});

var dynamodb = new AWS.DynamoDB();

var consolida = {};

consolida.update = function(items, callback) {
    var params = {
        RequestItems: {},
        ReturnConsumedCapacity: 'TOTAL',
        ReturnItemCollectionMetrics: 'SIZE'
    };
    params.RequestItems[config.dinamo_table_name] = items;
    dynamodb.batchWriteItem(params, function(err, data) {
        return callback(err);
    });    
}

module.exports = consolida;