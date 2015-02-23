var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var md5 = require('MD5');
var db = mongojs(config.db_connection_url, [config.source_collection_people]);

var people = {};

people.updateId = function() {
    var collection = eval('db.'+config.source_collection_people);

    collection.find().forEach(function(err, doc) {
        if (err) console.log(err);
        if (doc != null) {
          var userId = (doc.campusInfo && doc.campusInfo.userId) ? doc.campusInfo.userId : "0";
          var idp = doc._id;
          console.log('Updating document', userId, idp);
          collection.update({_id: idp}, {$set: {hash: md5(userId + idp)}});
        }
    });
};

module.exports = people;
