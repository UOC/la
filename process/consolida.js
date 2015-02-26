var async = require('async');
var util = require("util");

var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials();
var config = require('./config/settings').settings;

AWS.config.credentials = credentials;
AWS.config.update({region: config.aws_region});

var dynamodb = new AWS.DynamoDB();

var consolida = {};

consolida.execute = function(query, collection, block, pageNumber, queueLength, updateBlock, callback) {

    console.log('Starting process...');

    collection.count(query, function(err, total) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(util.format('%d registers found on the collection', total));
        var queue = async.queue(function (task, callback) {
            updateBlock(query, task.block, function(err, updatedblock) {
                return callback(err, updatedblock);
            });
        }, queueLength);

        queue.drain = function() {
            console.log('all items have been processed');
            callback();
        };

        while (total > pageNumber*block) {
            queue.push({ block: block++ }, function (err, updatedblock) {
                if (err) return callback(err);
                console.log(util.format('%d of %d blocks updated', updatedblock, Math.floor(total/pageNumber)));
            });            
        }
    });
};

consolida.batch = function(query, collection, block, pageNumber, updateBlock, callback) {

    console.log(query);
    console.log(collection);
    console.log('Starting process...');

    collection.count(query, function(err, total) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(util.format('%d registers found on the collection', total));
        async.whilst(
            function () { return total > pageNumber*block; },
            function (callback) {
                updateBlock(query, block, function(err, updatedblock) {
                    console.log(util.format('%d of %d blocks updated', updatedblock, Math.floor(total/pageNumber)));
                    block++;
                    return callback(err, updatedblock);
                });
            },
            function (err) {
                return callback(err);
            }
        );
    });
};

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