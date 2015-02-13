var mongojs = require('mongojs');
var config = require('../config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection]);

var initialBlock = 0;
if (config.matriculat && config.matriculat.initialBlock) {
  initialBlock = config.matriculat.initialBlock;
}

var matriculat = {};
matriculat.execute = function(AWS) {
  console.log('Starting process...');

  var pageNumber = 25;
  // our query: enrolments sucessfully finished
  var collection = eval('db.'+config.source_collection);
  var query = { "verb.id": "http://la.uoc.edu/verb/enrolment", "object.definition.extensions.edu:uoc:la:enrolment.cancelation.date": {$ne: ""}};
  db.statements.count(query, function(err, total) {
    if (err) {
      console.log(err);
      return;
    }

    console.log('Importing ', total, '...');

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
      db.statements.find(query).sort({"actor.account.name": 1}).limit(pageNumber).skip(skip).forEach(function(err, doc) {
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
                  S: 'MATRICULAT'
                },
                resource: {
                  M: {
                    code: {
                      S: doc.object.definition.extensions['edu:uoc:la:plan']['code']
                    },
                    description: {
                      S: doc.object.definition.extensions['edu:uoc:la:plan']['description']
                    }
                  }
                },
                result: {
                  S: doc.object.definition.extensions['edu:uoc:la:semester']['code']
                }
              }
            }
          });
        } else {
          // we visited all docs in the collection, time to update
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

module.exports = matriculat;
