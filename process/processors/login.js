var mongojs = require('mongojs');
var config = require('../config/settings').settings;
var fs = require('fs');
var db = mongojs(config.db_connection_url, [config.source_collection, config.people_source_collection]);
var initialBlock = 0;
if (config.login && config.login.initialBlock) {
  initialBlock = config.login.initialBlock;
}

var userHash = [];
var login = {};
var csvfile = 'logininfo.csv';

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
  console.log('Extracting data from mongo to temporary file');
  fs.exists(csvfile, function(exists) {
    if (!exists) {
      // create the file
      fs.open(csvfile, 'ax', function(err, fd) {
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

login.execute = function(AWS) {
  console.log('Starting process...');
  login.prepare(function() {
    console.log('Reading file...');

    var readLines = function(input, func) {
      var remaining = '';
      input.on('data', function(data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        while (index > -1) {
          var line = remaining.substring(0, index);
          remaining = remaining.substring(index + 1);
          func(line);
          index = remaining.indexOf('\n');
        }
      });

      input.on('end', function() {
        if (remaining.length > 0) {
          func(remaining);
        }
      });
    };

    var input = fs.createReadStream(csvfile);
    var pageNumber = 25;
    var dynamodb = new AWS.DynamoDB();
    var params = {
      RequestItems: {
      },
      ReturnConsumedCapacity: 'TOTAL',
      ReturnItemCollectionMetrics: 'SIZE'
    };
    params.RequestItems[config.dinamo_table_name] = [];
    var currentDoc = 0;
    var currentLine = 0;
    readLines(input, function(line) {
        var array = line.split('\t');
        console.log(array);
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
        currentLine++;
        if (++currentDoc == pageNumber) {
          console.log('Line'  +  currentLine + 'Finished. Updating to dynamo...');
          var line = currentLine;
          dynamodb.batchWriteItem(params, function(err, data) {
            if (err) {
              // an error occurred
              console.log(line, params, err, err.stack);
              process.exit()
            }
            else {
              if (!data) console.log('Error: No data returned on line', line);
            }
          });
          currentDoc = 0;
          paramsRequestItems[config.dinamo_table_name] = [];
        }
    });
  }, function(err) {
    // error
    console.log(err);
  });
};

module.exports = login;
