var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.destination_collection_grades]);

var grades = {};

/**
 *  * number of enrollments by semester
 *   * After this map-reduce, a the collection config.destination_collection_enrolment should have documents
 *    * with key as the semester and value as the number of enrollments
 *    */
grades.gradesBySemesterMR = function() {
    var mapper = function () {

      emit({code: this.object.definition.extensions['edu:uoc:la:subject']['code'], qualificacio_teorica: this.object.definition.extensions['edu:uoc:la:subject']['evaluation']['qt']}, 1);
    };

    var reducer = function (actor, values) {
      console.log("actor ", actor);
      console.log("values ", values);
        return Array.sum(values);
    };

    console.log("Start grades By Semester");
    var collection = eval('db.'+config.source_collection);
    collection.mapReduce(
        mapper,
        reducer, {
            query: { "verb.id": "http://la.uoc.edu/verb/performance" },
            out: config.destination_collection_grades
        }
    );
};

grades.gradesBySemester = function() {
    var collection = eval('db.'+config.source_collection);
    collection.runCommand("aggregate", {pipeline:[
      { $match: { "verb.id": "http://la.uoc.edu/verb/performance" }},
      { $group: { _id: {
                  codi_assignatura: "$object.definition.extensions.edu:uoc:la:subject.code", 
                  qualificacio_teorica: "$object.definition.extensions.edu:uoc:la:subject.evaluation.nf"}, 
                  //qualificacio_teorica: { $push: "$object.definition.extensions['edu:uoc:la:subject']['evaluation']['qt']" }, 
                  count: { $sum: 1 }}},
      { $out: config.destination_collection_grades }
    ], allowDiskUse:true 
    }, function(err, res) {
      if (err) console.log(err);
      console.log(res);
    } );
};

grades.query = function() {
    var collection = eval('db.'+config.source_collection);
    var j = 0;
    console.log('db.'+config.source_collection);
    collection.find({ "verb.id": "http://la.uoc.edu/verb/performance" }).forEach(function(err, doc) {
        if (err) console.log(err);
        if (doc != null) {
          if (doc.object.definition.extensions['edu:uoc:la:subject']['code'] == '01.500')
            console.log("j:" + ++j);
        }
    });


};

module.exports = grades;
