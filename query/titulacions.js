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

titulacions.notes = function(callback) {

    var mapper = function () {
        emit({
            code: this.object.definition.extensions["edu:uoc:la:subject"].code,
            description: this.object.definition.extensions["edu:uoc:la:subject"].description,
            semester: this.object.definition.extensions["edu:uoc:la:semester"].code
        }, {
            user: this.actor.account.name,
            af: this.object.definition.extensions["edu:uoc:la:subject"].evaluation.af,
            nf: this.object.definition.extensions["edu:uoc:la:subject"].evaluation.nf           
        });
    };

    var reducer = function (key, values) {
        var result = {
            aprovats: 0,
            total: 0,
            distribucio: {
                A: 0,
                B: 0,
                Cm: 0,
                Cn: 0,
                D: 0,
                N: 0,
                undefined: 0
            }
        };
        values.forEach(function(value) {
            result.distribucio[value.af]++;
            if (value.af == 'A' || value.af == 'B' || value.af == 'Cm' || value.af == 'Cn' ) {
                result.aprovats = result.aprovats + 1;
            }
        });
        result.total = values.length;
        return result;
    };

    var options = {
        query: { "verb.id": "http://la.uoc.edu/verb/performance" },
        out: config.destination_collection_grades_by_subject_and_semester
    };

    source = db[config.source_collection];
    destination = db[config.destination_collection_grades_by_subject_and_semester];

    destination.remove(function(err, collection) {
        if (err) return callback(err);
        source.mapReduce(mapper, reducer, options, function(err, collection) {
            return callback(err, collection);
        });
    });
}

titulacions.notes_estudis = function(callback) {

    db.statements.mapReduce(
        function () {

            var af = this.object.definition.extensions["edu:uoc:la:subject"].evaluation.af;
            var result = {
                aprovats: 0,
                total: 0,
                distribucio: {
                    A: 0,
                    B: 0,
                    Cm: 0,
                    Cn: 0,
                    D: 0,
                    N: 0,
                    undefined: 0
                }
            };

            result.distribucio[af]++;
            result.total = 1;

            if (af == 'A' || af == 'B' || af == 'Cm' || af == 'Cn' ) {
                result.aprovats = result.aprovats + 1;
            }

            emit({
                code: this.object.definition.extensions["edu:uoc:la:study"].code,
                description: this.object.definition.extensions["edu:uoc:la:study"].description,
                semester: this.object.definition.extensions["edu:uoc:la:semester"].code
            }, result);
        },
        function(key, values) {
            var result = {
                aprovats: 0,
                total: 0,
                distribucio: {
                    A: 0,
                    B: 0,
                    Cm: 0,
                    Cn: 0,
                    D: 0,
                    N: 0,
                    undefined: 0
                }
            };
            values.forEach(function(value) {
                result.aprovats += value.aprovats;
                result.total += value.total;
                result.distribucio.A += value.distribucio.A;
                result.distribucio.B += value.distribucio.B;
                result.distribucio.Cm += value.distribucio.Cm;
                result.distribucio.Cn += value.distribucio.Cn;
                result.distribucio.D += value.distribucio.D;
                result.distribucio.N += value.distribucio.N;
                result.distribucio.undefined += value.distribucio.undefined;
            });
            return result;
        },
        {
            query: {
                "verb.id": "http://la.uoc.edu/verb/performance"
            },
            out: "notes_per_estudis_i_semestres"
        }
    );
}

titulacions.notes_assignatures = function(callback) {
    
    db.statements.mapReduce(
        function () {

            var af = this.object.definition.extensions["edu:uoc:la:subject"].evaluation.af;
            var result = {
                aprovats: 0,
                total: 0,
                distribucio: {
                    A: 0,
                    B: 0,
                    Cm: 0,
                    Cn: 0,
                    D: 0,
                    N: 0,
                    undefined: 0
                }
            };

            result.distribucio[af]++;
            result.total = 1;

            if (af == 'A' || af == 'B' || af == 'Cm' || af == 'Cn' ) {
                result.aprovats = result.aprovats + 1;
            }

            emit({
                code: this.object.definition.extensions["edu:uoc:la:subject"].code,
                description: this.object.definition.extensions["edu:uoc:la:subject"].description,
                semester: this.object.definition.extensions["edu:uoc:la:semester"].code
            }, result);
        },
        function(key, values) {
            var result = {
                aprovats: 0,
                total: 0,
                distribucio: {
                    A: 0,
                    B: 0,
                    Cm: 0,
                    Cn: 0,
                    D: 0,
                    N: 0,
                    undefined: 0
                }
            };
            values.forEach(function(value) {
                result.aprovats += value.aprovats;
                result.total += value.total;
                result.distribucio.A += value.distribucio.A;
                result.distribucio.B += value.distribucio.B;
                result.distribucio.Cm += value.distribucio.Cm;
                result.distribucio.Cn += value.distribucio.Cn;
                result.distribucio.D += value.distribucio.D;
                result.distribucio.N += value.distribucio.N;
                result.distribucio.undefined += value.distribucio.undefined;
            });
            return result;
        },
        {
            query: {
                "verb.id": "http://la.uoc.edu/verb/performance"
            },
            out: "notes_per_estudis_i_semestres"
        }
    );
}

module.exports = titulacions;
