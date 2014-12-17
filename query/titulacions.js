var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.destination_collection_enrolment_by_degree_and_semester]);

var titulacions = {};

titulacions.execute = function(callback) {

    var mapper = function () {
        emit(this.object.definition.extensions["edu:uoc:la:study"], 1);
    };

    var reducer = function (titulacio, count) {
        return Array.sum(count);
    };

    var options = {
        query: { "verb.id": "http://la.uoc.edu/verb/performance" },
        out: config.destination_collection_enrolment_by_degree_and_semester
    };

    source = db[config.source_collection];
    destination = db[config.destination_collection_enrolment_by_degree_and_semester];

    destination.remove(function(err, collection) {
        if (err) return callback(err);
        source.mapReduce(mapper, reducer, options, function(err, collection) {
            return callback(err, collection);
        });
    });
};

module.exports = titulacions;
