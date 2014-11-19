var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.destination_collection]);

var aep = {};

aep.execute = function() {
    var mapper = function () {
        emit(this.actor.account.name, 1);
    };    

    var reducer = function (actor, count) {
        return Array.sum(count);
    };

    eval('db.'+config.source_collection+'.mapReduce('+
        'mapper,'+
        'reducer, {'+
            'query: { "verb.id": "http://la.uoc.edu/verb/aeprequest" },'+
	    'out: "'+config.destination_collection+'"'+
        '}'+
    ');');

    eval('db.'+config.source_collection+'.find(function (err, docs) {'+
        'if (err) console.log(err);'+
        'console.log("\\\n", docs);'+
    '});');
};

aep.query = function() {
    db.statements.find({ "verb.id": "http://la.uoc.edu/verb/aeprequest" }).limit(2, function(err, docs) {
        if (err) console.log(err);
        console.log("\n", docs);
    });
};

module.exports = aep;
