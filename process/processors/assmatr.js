var mongojs = require('mongojs');
var config = require('../config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.collection_enrollment_by_user, config.collection_enrollment_by_user_and_semester]);

var matriculat = {};
matriculat.prepareEnrolmentByUserAndSemester = function(callback, errorCallback) {
  var collection = eval('db.'+config.collection_enrollment_by_user);
  /*
   * This is the API call, but allowDiskUse doesn't propagate to mongo,
   * so we use the generic runCommand method
      collection.aggregate([
        {$match: { "verb.id": "http://la.uoc.edu/verb/subject/enrolment" }},
        {$group: {
          _id: {user: "$actor.account.name", code: "$object.definition.extensions.edu:uoc:la:semester.code"},
          total: {$sum:1}
        }},
        { $out: config.collection_enrollment_by_user_and_semester }
      ])
  */
  collection.runCommand("aggregate", {pipeline:[
    {$match: { "verb.id": "http://la.uoc.edu/verb/subject/enrolment" }},
    {$group: {
      _id: {user: "$actor.account.name", code: "$object.definition.extensions.edu:uoc:la:semester.code"},
      total: {$sum:1}
    }},
    { $out: config.collection_enrollment_by_user_and_semester }
    ], allowDiskUse:true
  }, function(err, res) {
    if (err && errorCallback) errorCallback(err);
    if (!err && callback) callback(res);
  });
};

matriculat.prepare = function(callback, errorCallback) {
  // "statements" collection contains performance records, which implicitly contains enrollment
  // info about users and subjects.
  // We can calculate enrollment data from that initial data
  matriculat.prepareEnrolmentByUserAndSemester(function() {
    if (callback) callback();
  }, errorCallback);
};

matriculat.execute = function(AWS) {
  console.log('Starting process...');
  matriculat.prepare(function() {
    var pageNumber = 25;
    var collection = eval('db.'+config.collection_enrollment_by_user_and_semester);
    collection.count({}, function(err, total) {
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

        collection.find().sort({"_id": 1}).skip(skip).limit(pageNumber).forEach(function(err, doc) {
          if (err) console.log(err);
          if (doc != null) {

            // create document in dinamo
            params.RequestItems[config.dinamo_table_name].push({
              PutRequest: {
                Item: { /* required */
                  objectId: { /* AttributeValue */
                    S: doc._id.user + ":" + doc._id.code
                  },
                  user: {
                    S: doc._id.user
                  },
                  time: {
                    S: doc._id.code
                  },
                  service: {
                    S: 'ASSMATR'
                  },
                  resource: {
                    S: doc._id.code
                  },
                  result: {
                    N: doc.total.toString()
                  }
                }
              }
            });
          } else {
            if (params.RequestItems[config.dinamo_table_name].length > 0) {
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
      update(0);

    });
  }, function(err) {
    // error
    console.log(err);
  });
};

module.exports = matriculat;
