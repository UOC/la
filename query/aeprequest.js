var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.destination_collection_aep]);

var aep = {};

aep.execute = function(callback) {

    var mapper = function () {
        emit(this.actor.account.name, 1);
    };    

    var reducer = function (actor, count) {
        return Array.sum(count);
    };

    var options = {
        query: { "verb.id": "http://la.uoc.edu/verb/aeprequest" },
        out: config.destination_collection_aep
    };

    source = db[config.source_collection];
    destination = db[config.destination_collection_aep];

    destination.remove(function(err, collection) {
        if (err) return callback(err);
        source.mapReduce(mapper, reducer, options, function(err, collection) {
            return callback(err, collection);
        });
    });
};

module.exports = aep;
