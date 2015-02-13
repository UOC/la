var mongojs = require('mongojs');
var config = require('../config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection]);
var initialBlock = 0;
if (config.aepresposta && config.aepresposta.initialBlock) {
  initialBlock = config.login.initialBlock;
}

var aep = {};
aep.execute = function(AWS) {
  console.log('Starting process...');

  var pageNumber = 25;
  db.statements.count({ "verb.id": "http://la.uoc.edu/verb/aeprequest" }, function(err, total) {
    if (err) {
      console.log(err);
      return;
    }

    var updateBlock = function(blockIndex, callback) {
      var dynamodb = new AWS.DynamoDB();
      var params = {
        RequestItems: {
        },
        ReturnConsumedCapacity: 'TOTAL',
        ReturnItemCollectionMetrics: 'SIZE'
      };
      params.RequestItems[config.dinamo_table_name] = [];

      var skip = blockIndex === 0 ? 0 : blockIndex * pageNumber;
      db.statements.find({ "verb.id": "http://la.uoc.edu/verb/aeprequest" }).sort({"actor.account.name": 1}).limit(pageNumber).skip(skip).forEach(function(err, doc) {
        if (err) console.log(err);
        if (doc != null) {

          var semester = doc.object.definition.extensions['edu:uoc:la:semester']['validated'];
          if (!semester) semester = doc.object.definition.extensions['edu:uoc:la:semester']['code'];
          // create document in dinamo
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
                  S: 'AEPRESPOSTA'
                },
                resource: {
                  M: {
                    code: {
                      S: doc.object.definition.extensions['edu:uoc:la:subject']['code']
                    },
                    credits: {
                      N: doc.object.definition.extensions['edu:uoc:la:subject']['credits']
                    }
                  }
                },
                result: {
                  S: doc.object.definition.extensions['edu:uoc:la:aep']['status']
                }
              }
            }
          });
        } else {
          // we visited all docs in the collection, time to update
          if (params.RequestItems[config.dinamo_table_name].length > 0) {
            console.log('MongoDB Cursor ' + blockIndex + ' Finished. Updating to dynamo...');
            dynamodb.batchWriteItem(params, function(err, data) {
              if (err) {
                // an error occurred
                console.log(params, err, err.stack);
              }
              else {
                if (!data) console.log('Error: No data returned');
                else {
                  // show current status
                  console.log(data);
                  callback(blockIndex);
                }
              }
            });
          } else {
            setTimeout(function() {
              callback(blockIndex);
            }, 10);
          }
        }
      });
    };

      // recursive by callback
    var update = function(index) {
      updateBlock(index, function(indexUpdated) {
        if (pageNumber * indexUpdated < total) {
          update(indexUpdated + 1);
        }
      })
    };

    // initial call
    update(initialBlock);

  });
};

module.exports = aep;
