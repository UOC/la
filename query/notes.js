var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.destination_collection_grades, config.destination_collection_grades_by_user]);

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

grades.gradesByUser = function() {
    var collection = eval('db.'+config.source_collection);
    collection.runCommand("aggregate", {pipeline:[
      { $match: { "verb.id": "http://la.uoc.edu/verb/performance" }},
      { $group: { _id: "$actor.account.name", semester: { $push: "$object" }}},
      { $out: config.destination_collection_grades_by_user }
    ], allowDiskUse:true
    }, function(err, res) {
      if (err) console.log(err);
      console.log(res);
      // we can query those students enrolled in more than 1 semestre using:
      // db.matricula_per_usuaris.find({ $where: "this.semester.length > 1" })
    } );
};

grades.gradesBySemester = function() {
    var collection = eval('db.'+config.destination_collection_grades_by_user);
    collection.runCommand("aggregate", {pipeline:[
      { $unwind: "$semester"},
      
      { $project: { 
          codi_assignatura: "$semester.definition.extensions.edu:uoc:la:subject.code",
          nota_final: "$semester.definition.extensions.edu:uoc:la:subject.evaluation.nf"
      }},
      { $group: { 
          _id: {
            codi_assignatura: "$codi_assignatura", 
            nota_final: "$nota_final",                     
          }, 
                  //qualificacio_teorica: { $push: "$object.definition.extensions['edu:uoc:la:subject']['evaluation']['qt']" }, 
                  total: { $sum: 1 }}
      },
      { $out: config.destination_collection_grades }
    ], allowDiskUse:true 
    }, function(err, res) {
      if (err) console.log(err);
      console.log(res);
    } );
};

module.exports = grades;
