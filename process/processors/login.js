var mongojs = require('mongojs');
var config = require('../config/settings').settings;
var fs = require('fs');
var db = mongojs(config.db_connection_url, [config.source_collection, config.people_source_collection]);
// var initialBlock = config.login && config.login.initialBlock ? config.login.initialBlock : 0;
var removePreviousElements = config.login && config.login.removePreviousElements ? config.login.removePreviousElements : false;

var userHash = [];
var login = {};

login.getCSVfile = function() {
  return process.argv.length > 2 ? process.argv[2] : 'logininfo.csv';
};

login.prepare = function(callback, errorCallback) {
  login.extractPeople(function() {
    login.extractFromMongo(callback, errorCallback);
  }, errorCallback);
};

login.extractPeople = function(callback, errorCallback) {
  console.log('Extracting people');
  var peopleCollection = eval('db.'+config.people_source_collection);
  peopleCollection.find().forEach(function(err, doc) {
    if (err) {
      if (errorCallback) {
          errorCallback(err);
      } else {
        console.log(err);
      }
      return;
    }
    if (doc != null && doc.campusInfo && doc.campusInfo.userId) {
      userHash[parseInt(doc.campusInfo.userId)] = doc.hash;
    }
    else if (doc == null) {
      // callback()
      console.log('callback!', userHash.length);
      callback();
    }
  });
};

login.extractFromMongo= function(callback, errorCallback) {
  console.log('Extracting data from mongo to temporary file', login.getCSVfile());
  fs.exists(login.getCSVfile(), function(exists) {
    if (!exists) {
      // create the file
      fs.open(login.getCSVfile(), 'ax', function(err, fd) {
        if (err) {
          if (errorCallback) {
            errorCallback(err);
          }
        } else {
          // write records to file
          var collection = eval('db.'+config.source_collection);
          var pageNumber = 25;
          var query = {"verb.id":"http://la.uoc.edu/verb/login", "object.definition.extensions.edu:uoc:la:login.login": {$gt: "2014-09-01T00:00:00"}};

          var notFoundUsers = 0;
          collection.find(query).skip(initialBlock * pageNumber).forEach(function(err, doc) {
            if (err) {
              if (errorCallback) {
                errorCallback(err);
              }
            } else if (doc != null){
              var user = userHash[parseInt(doc.actor.account.name)];
              if (user != null) {
                fs.writeSync(fd, doc._id.toHexString() + '\t' + user + '\tLOGIN\t' + doc.object.definition.extensions['edu:uoc:la:login']['login'] + '\n');
                fs.writeSync(fd, doc._id.toHexString() + '\t' + user + '\tLOGOUT\t' + doc.object.definition.extensions['edu:uoc:la:login']['logout'] + '\n');
              } else {
                console.log('user', doc.actor.account.name, 'not found. Using default value');
                notFoundUsers++;
                fs.writeSync(fd, doc._id.toHexString() + '\t' + doc.actor.account.name + '\tLOGIN\t' + doc.object.definition.extensions['edu:uoc:la:login']['login'] + '\n');
                fs.writeSync(fd, doc._id.toHexString() + '\t' + doc.actor.account.name + '\tLOGOUT\t' + doc.object.definition.extensions['edu:uoc:la:login']['logout'] + '\n');
              }
            } else {
              // doc is null
              fs.closeSync(fd);
              console.log('Finishing user csv file with ' + notFoundUsers + ' users not found.');
              callback();
            }
          });
        }
      });
    } else {
      callback();
    }
  });
};

login.deleteItems = function(AWS, items) {
  var params = {
    TableName: config.dinamo_table_name,
  };
  var dynamodb = new AWS.DynamoDB();
  var callback = function(err, data) {
    if (err) console.log("Error deleting", err, err.stack); // an error occurred
    else     console.log("Deleted", data);           // successful response
  };
  for (var i = 0; i < items.length; i++) {
    params.Key = items[i];
    params.Key.service = {'S': 'LOGIN'};
    console.log('about to delete', params);
    dynamodb.deleteItem(params, callback);
  }
};

login.removePreviousElementsAtBlock = function(AWS, params, lastEvaluatedKey, callback, errorCallback) {
  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  var dynamodb = new AWS.DynamoDB();
  dynamodb.query(params, function(err, data) {
    if (err) {
      errorCallback(err);
    }  else {
      console.log(data, data.Items);
      login.deleteItems(AWS, data.Items);
      if (data.LastEvaluatedKey) {
        login.removePreviousElementsAtBlock(AWS, params, data.LastEvaluatedKey, callback, errorCallback);
      } else {
        callback();
      }
    }
  });
}

login.removePreviousElements = function(AWS, callback, errorCallback) {
  console.log('Removing previous elements...');
  var params = {
    KeyConditions: {
      service: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
          {"S": 'LOGIN'}
        ]
      }
    },
    TableName: config.dinamo_table_name,
    AttributesToGet: [
      'objectId'
    ],
    IndexName: 'service-index',
    Limit: 100000,
    ReturnConsumedCapacity: 'NONE',
    Select: 'SPECIFIC_ATTRIBUTES'
  };

  login.removePreviousElementsAtBlock(AWS, params, null, callback, errorCallback);
};

login.importFile = function(AWS) {
  console.log('Reading file...');


  var readLines = function(input, number, func) {
    var remaining = '';

    input.on('data', function(data) {
      console.log('Read', data.length);
      remaining += data;
      // readBlockOfLines();
    });

    var readBlockOfLines = function() {
      console.log('Reading', number, 'lines', remaining.length);
      var forceBreak = false;
      var current = 0;
      var lines = [];
      var index = remaining.indexOf('\n');
      while (index > -1 && !forceBreak) {
        var line = remaining.substring(0, index);
        remaining = remaining.substring(index + 1);
        lines.push(line);
        if (++current === number) {
          forceBreak = true;
          func(lines, readBlockOfLines);
        } else {
          index = remaining.indexOf('\n');
        }
      }
      if(!forceBreak) {
        if (remaining.length > 0) {
          lines.push(remaining);
          func(lines, function() {
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      }
    };

    input.on('end', function() {
      console.log('end');
      if (remaining.length > 0) {
        readBlockOfLines();
      } else {
        process.exit(0);
      }
    });
  };

  var csvfile = login.getCSVfile();
  var initialLine = config.login && config.login.initialLine && config.login.initialLine[csvfile] ? config.login.initialLine[csvfile] : 0;

  var input = fs.createReadStream(csvfile);
  var pageNumber = 25;
  var dynamodb = new AWS.DynamoDB();
  var params = {
    RequestItems: {
    },
    ReturnConsumedCapacity: 'TOTAL',
    ReturnItemCollectionMetrics: 'SIZE'
  };
  var currentLine = 0;
  readLines(input, 25, function(lines, callback) {
    if (currentLine < initialLine) {
      console.log('Skipping line', currentLine);
      currentLine += lines.length;
      if (callback) {
        callback();
      }
    } else {
      params.RequestItems[config.dinamo_table_name] = [];
      for (var i = 0; i < lines.length; i++) {
        var array = lines[i].split('\t');
        // console.log(array);
        params.RequestItems[config.dinamo_table_name].push({
          PutRequest: {
            Item: { /* required */
              objectId: { /* AttributeValue */
                S: array[0]
              },
              user: {
                S: array[1]
              },
              time: {
                S: '20141'
              },
              service: {
                S: array[2] // 'LOGIN' or 'LOGOUT'
              },
              resource: {
                S: 'NA'
              },
              result: {
                S: array[3] // doc.object.definition.extensions['edu:uoc:la:login']['login'] or doc.object.definition.extensions['edu:uoc:la:login']['logout']
              }
            }
          }
        });
      }
      console.log('Line '  +  currentLine + ' Finished. Updating to dynamo...');
      var theLine = currentLine;
      currentLine += lines.length;
      dynamodb.batchWriteItem(params, function(err, data) {
        if (err) {
          // an error occurred
          console.log(theLine, params, err, err.stack);
          process.exit(1);
        }
        else {
          if (!data) {
            console.log('Error: No data returned on line', theLine);
            process.exit(1);
          }
          console.log(theLine, 'updated!', csvfile);
          if (callback) {
            callback();
          }
        }
      });
    }
  });
};

login.execute = function(AWS) {
  console.log('Starting process...');
  login.prepare(function() {
    if (removePreviousElements) {
      login.removePreviousElements(AWS, function() {
        login.importFile(AWS);
      }, function(err) {
        console.log(err);
        process.exit(1);
      });
    } else {
      login.importFile(AWS);
    }
  }, function(err) {
    // error
    console.log(err);
    process.exit(1);
  });
};

module.exports = login;
