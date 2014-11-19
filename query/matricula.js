var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.destination_collection_enrolment]);

var matricula = {};

matricula.execute = function() {
    var mapper = function () {
      emit(this.object.definition.extensions['edu:uoc:la:semester']['code'], 1);
    };

    var reducer = function (actor, values) {
        return values.length;
    };

    eval('db.'+config.source_collection+'.mapReduce('+
        'mapper,'+
        'reducer, {'+
            'query: { "verb.id": "http://la.uoc.edu/verb/enrolment" },'+
            'out: "'+config.destination_collection_enrolment+'"'+
        '}'+
    ');');
    eval('db.'+config.destination_collection_enrolment+'.find(function (err, docs) {'+
        'if (err) console.log(err);'+
        'console.log("\\\n", docs);'+
    '});');
};

matricula.query = function() {
    db.importduran.find({ "verb.id": "http://la.uoc.edu/verb/enrolment" }).limit(2, function(err, docs) {
        if (err) console.log(err);
        console.log("\n", docs);
        console.log(docs[0].object.definition);
    });
};

module.exports = matricula;
