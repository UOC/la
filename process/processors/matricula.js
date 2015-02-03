var mongojs = require('mongojs');
var config = require('../config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection]);

var initialBlock = 0;
if (config.matricula && config.matricula.initialBlock) {
  initialBlock = config.matricula.initialBlock;
}

var matricula = {};
matricula.execute = function(AWS) {
  console.log('Starting process...');
    var pageNumber = 25;
    var collection = eval('db.'+config.source_collection);
    var query = { "verb.id": "http://la.uoc.edu/verb/subject/enrolment", "object.definition.extensions.edu:uoc:la:subject.code": {$ne: ""}};
    collection.count(query, function(err, total) {
      if (err) {
        console.log(err);
        return;
      }

      console.log('Importing ', total, '...');
      var updateBlock = function(blockIndex, callback) {
        if (blockIndex < initialBlock) {
          console.log('Skipping block ' + blockIndex);
          setTimeout(function() {
            callback(blockIndex);
          }, 10);
        } else {
          var dynamodb = new AWS.DynamoDB();
          var params = {
            RequestItems: {
            },
            ReturnConsumedCapacity: 'TOTAL',
            ReturnItemCollectionMetrics: 'SIZE'
          };
          params.RequestItems[config.dinamo_table_name] = [];
          var skip = blockIndex === 0 ? 0 : blockIndex * pageNumber;
          collection.find(query).sort({"_id": 1}).limit(pageNumber).skip(skip).forEach(function(err, doc) {
            if (err) console.log(err);
            if (doc != null) {
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
                      S: doc.object.definition.extensions['edu:uoc:la:semester']['code']
                    },
                    service: {
                      S: 'MATRICULA'
                    },
                    resource: {
                      S: doc.object.definition.extensions['edu:uoc:la:semester']['code']
                    },
                    result: {
                      S: doc.object.definition.extensions['edu:uoc:la:subject']['code']
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
        }
      };

      // recursive by callback
      var update = function(index) {
        updateBlock(index, function(indexUpdated) {
          if (pageNumber * indexUpdated < total) {
            update(indexUpdated + 1);
          } else {
            // exit
            process.exit();
          }
        })
      };

      // initial call
      update(0);

    });
};

module.exports = matricula;
