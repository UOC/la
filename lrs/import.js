var util = require("util");
var consolida = require('./consolida');

var path = require('path');
var args = process.argv.slice(2);
var filename = args[0];

var fs = require('fs')
    , stream = require('stream')
    , es = require("event-stream")
    , mongojs = require('mongojs')
    , config = require('../config/settings').settings;

var index = 1;
var bufferSize = 25;
var items = [];

// extract people from mongo collection
var db = mongojs(config.db_connection_url, [config.source_collection, config.people_source_collection]);
var userHash = [];
var extractPeople = function(callback, errorCallback) {
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
    if (doc !== null && doc._id) {
      userHash[parseInt(doc._id)] = doc.hash;
    }
    else if (doc == null) {
      // callback()
      console.log('callback!', userHash.length);
      callback();
    }
  });
};

extractPeople(function() {
  var s = fs.createReadStream(filename)
      .pipe(es.split())
      .pipe(es.mapSync(function(line) {
          s.pause();
          make(line, function(err) {
              s.resume();
          });
      })
      .on('error', function() {
          console.log('Error while reading file.');
      })
      .on('end', function() {
          if (items.length > 0) {
              consolida.update(items, function(err) {
                  err && console.log(err);
                  console.log(util.format('%d blocks updated', index++));
              });
          }
      })
  );
}, function(err) {
  console.log(err);
  process.exit(-1);
});


var make = function(line, callback) {
    if (!line) return callback();
    var item = transform(line);
    if (item) items.push(item);
    if (items.length != bufferSize) return callback();
    consolida.update(items, function(err) {
        err && console.log(err);
        console.log(util.format('%d blocks updated', index++));
        items = [];
        return callback();
    });
}

var accesaula = require('./filters/accesaula');
var acceseina = require('./filters/acceseina');
var pladocent = require('./filters/pladocent');
var accesactivitat = require('./filters/accesactivitat');
var recursosassign = require('./filters/recursosassign');

var transform = function(line) {
    var item;
    var doc = JSON.parse(line);

    // filter username
    if (doc && doc.actor && doc.actor.account && doc.actor.account.name && userHash[parseInt(doc.actor.account.name)]) {
      console.log('ofuscating user', doc.actor.account.name);
      doc.actor.account.name = userHash[parseInt(doc.actor.account.name)];
    } else {
      console.log('User not found, using original value');
    }

    item = acceseina.transform(doc); if (item) return item;
    item = pladocent.transform(doc); if (item) return item;
    item = accesaula.transform(doc); if (item) return item;
    item = accesactivitat.transform(doc); if (item) return item;
    item = recursosassign.transform(doc); if (item) return item;

    console.log(line);
    return false;
}
