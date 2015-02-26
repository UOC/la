var AWS = require('aws-sdk');
var mongojs = require('mongojs');

var config = require('../config/settings').settings;
var consolida = require('../consolida');
var db = mongojs(config.db_connection_url, [config.source_collection]);
var credentials = new AWS.SharedIniFileCredentials();

var collection = db[config.source_collection];

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
    //collection.find(query).sort({ "actor.account.name": 1 }).limit(pageNumber).skip(skip).forEach(function(err, doc) {
    collection.find(query).limit(pageNumber).skip(skip).forEach(function(err, doc) {

        if (err) console.log(err);
        if (doc != null) {

            var semester = doc.object.definition.extensions['edu:uoc:la:semester']['code'];
            var qualification = doc.object.definition.extensions['edu:uoc:la:subject'].evaluation.nf;
            var subject = doc.object.definition.extensions['edu:uoc:la:subject'].code;
            var classroom = doc.object.definition.extensions['edu:uoc:la:classroom'].code;

            qualification = qualification == '' ? '-' : qualification;

            //console.log(doc._id.toHexString());

            if (semester && subject && classroom) {
                params.RequestItems[config.dinamo_table_name].push({
                    PutRequest: {
                        Item: { /* required */
                            objectId: { /* AttributeValue */
                                S: doc._id.toHexString()
                            },
                            user: {
                                S: doc.actor.account.name
                            },
                            time: {
                                S: semester
                            },
                            service: {
                                S: 'NOTAFINAL'
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
                                S: qualification
                            }
                        }
                    }
                });
            }
        } else {
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

var query = { "verb.id": "http://la.uoc.edu/verb/performance" };

//var initialBlock = 18184;
var initialBlock = 0;
var pageNumber = 25;
var queueLength = 1;

consolida.batch(query, collection, initialBlock, pageNumber, updateBlock, function(err) {
    process.exit();
});