var mongojs = require('mongojs');
var db = mongojs('mongodb://localhost:27017/lrs', ['statements', 'aep']);

var aep = {};

aep.execute = function() {
    var mapper = function () {
        emit(this.actor.account.name, 1);
    };    

    var reducer = function (actor, count) {
        return Array.sum(count);
    };

    db.statements.mapReduce(
        mapper,
        reducer, {
            query: { "verb.id": "http://la.uoc.edu/verb/aeprequest" },
            out: "aep"
        }
    );

    db.aep.find(function (err, docs) {
        if (err) console.log(err);
        console.log("\n", docs);
    });
};

aep.query = function() {
    db.statements.find({ "verb.id": "http://la.uoc.edu/verb/aeprequest" }).limit(2, function(err, docs) {
        if (err) console.log(err);
        console.log("\n", docs);
    });
};

module.exports = aep;