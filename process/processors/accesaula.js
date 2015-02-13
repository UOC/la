var AWS = require('aws-sdk');
var mongojs = require('mongojs');

var config = require('../config/settings').settings;
var consolida = require('../consolida');
var db = mongojs(config.db_connection_url, [config.source_collection_aula]);
var credentials = new AWS.SharedIniFileCredentials();

var collection = db[config.source_collection_aula];

AWS.config.credentials = credentials;
AWS.config.update({region: config.aws_region});

var dynamodb = new AWS.DynamoDB();

var updateBlock = function(query, blockIndex, callback) {

    var params = {
        RequestItems: {},
        ReturnConsumedCapacity: 'TOTAL',
        ReturnItemCollectionMetrics: 'SIZE'
    };
    params.RequestItems[config.dinamo_table_name] = [];

    var skip = blockIndex === 0 ? 0 : blockIndex * pageNumber;
    collection.find(query).sort({ "actor.account.name": 1 }).limit(pageNumber).skip(skip).forEach(function(err, doc) {

        if (err) return callback(err);
        if (doc != null) {

            var id = doc._id.toHexString();
            var user = doc.actor.account.name;
            var semester = doc.timestamp;
            var subject = doc.context.extensions['uoc:lrs:subject:id'];
            var classroom = doc.context.extensions['uoc:lrs:classroom:id'];


            //console.log(doc._id.toHexString());

            if (user && semester && subject && classroom) {
                params.RequestItems[config.dinamo_table_name].push({
                    PutRequest: {
                        Item: { /* required */
                            objectId: { /* AttributeValue */
                                S: id
                            },
                            user: {
                                S: user
                            },
                            time: {
                                S: semester
                            },
                            service: {
                                S: 'ACCESAULA'
                            },
                            resource: {
                                M: {
                                    subject: {
                                        S: subject
                                    }, 
                                    classroom: {
                                        S: classroom
                                    }
                                }
                            },
                            result: {
                                S: "-"
                            }
                        }
                    }
                });
            }
        } else {
            // we visited all docs in the collection, time to update
            console.log('MongoDB Cursor ' + blockIndex + ' Finished. Updating to dynamo...');
            dynamodb.batchWriteItem(params, function(err, data) {
                if (err) {
                    // an error occurred
                    console.log(params, err, err.stack);
                    callback(err);
                } else {
                    if (!data) console.log('Error: No data returned');
                    else {
                        // show current status
                        //console.log(data);
                    }
                    callback(null, blockIndex);
                }
            });
        }
    });
};

var query = { "object.id" : "https://cv.uoc.edu/webapps/aulaca" };

var initialBlock = 58327;
var pageNumber = 25;
var queueLength = 1;

consolida.batch(query, collection, initialBlock, pageNumber, updateBlock, function(err) {
    process.exit();
});