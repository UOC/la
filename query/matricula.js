var mongojs = require('mongojs');
var db = mongojs('mongodb://54.78.58.39:27017/lrs', ['importduran', 'matricula_per_semestres']);

var matricula = {};

matricula.execute = function() {
    var mapper = function () {
      emit(this.object.definition.extensions['edu:uoc:la:semester']['code'], 1);
    };

    var reducer = function (actor, values) {
        return values.length;
    };

    db.importduran.mapReduce(
        mapper,
        reducer, {
            query: { "verb.id": "http://la.uoc.edu/verb/enrolment" },
            out: "matricula_per_semestres"
        }
    );

    db.matricula_per_semestres.find(function (err, docs) {
        if (err) console.log(err);
        console.log("\n", docs);
    });
};

matricula.query = function() {
    db.importduran.find({ "verb.id": "http://la.uoc.edu/verb/enrolment" }).limit(2, function(err, docs) {
        if (err) console.log(err);
        console.log("\n", docs);
        console.log(docs[0].object.definition);
    });
};

module.exports = matricula;
