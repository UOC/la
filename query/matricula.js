var mongojs = require('mongojs');
var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, config.destination_collection_enrolment]);

var matricula = {};

/**
 * number of enrollments by semester
 * After this map-reduce, a the collection config.destination_collection_enrolment should have documents
 * with key as the semester and value as the number of enrollments
*/
matricula.enrollmentsBySemester = function() {
    var mapper = function () {
      emit(this.object.definition.extensions['edu:uoc:la:semester']['code'], 1);
    };

    var reducer = function (actor, values) {
        return Array.sum(values);
    };

    var collection = eval('db.'+config.source_collection);
    collection.mapReduce(
        mapper,
        reducer, {
            query: { "verb.id": "http://la.uoc.edu/verb/enrolment" },
            out: config.destination_collection_enrolment
        }
    );
};

matricula.enrollmentsByUser = function() {
    var collection = eval('db.'+config.source_collection);
    /*
     * This is the API call, but allowDiskUse doesn't propagate to mongo,
     * so we use the generic runCommand method
    collection.aggregate([
      { $match: { "verb.id": "http://la.uoc.edu/verb/enrolment" }},
      { $group: { _id: "$actor.account.name", semester: { $push: "$object" }}},
      { $out: config.destination_collection_enrolment_by_user }
    ], {
      allowDiskUse: true
    });
    */
    collection.runCommand("aggregate", {pipeline:[
      { $match: { "verb.id": "http://la.uoc.edu/verb/enrolment" }},
      { $group: { _id: "$actor.account.name", semester: { $push: "$object" }}},
      { $out: config.destination_collection_enrolment_by_user }
    ], allowDiskUse:true
    }, function(err, res) {
      if (err) console.log(err);
      console.log(res);
      // we can query those students enrolled in more than 1 semestre using:
      // db.matricula_per_usuaris.find({ $where: "this.semester.length > 1" })
    } );
};

matricula.enrollmentsByUserAndSemester = function() {
  var collection = eval('db.'+config.destination_collection_enrolment_by_user);
  /*
   * This is the API call, but allowDiskUse doesn't propagate to mongo,
   * so we use the generic runCommand method
    collection.aggregate([
      {$unwind: "$semester"},
      {$project: { code: "$semester.definition.extensions.edu:uoc:la:semester.code"}},
      {$group: {
        _id: {user: "$_id", code: "$code"},
        total: {$sum:1}
      }}
    ])
  */
  collection.runCommand("aggregate", {pipeline:[
    {$unwind: "$semester"},
    {$project: { code: "$semester.definition.extensions.edu:uoc:la:semester.code"}},
    {$group: {
      _id: {user: "$_id", code: "$code"},
      total: {$sum:1}
    }}
  ], allowDiskUse:true
  }, function(err, res) {
    if (err) console.log(err);
    console.log(res);
    // we can query those students enrolled in more than 1 semestre using:
    // db.matricula_per_usuaris.find({ $where: "this.semester.length > 1" })
  } );
};

matricula.query = function() {
    var collection = eval('db.'+config.source_collection);
    var j = 0;
    collection.find({ "verb.id": "http://la.uoc.edu/verb/enrolment" }).forEach(function(err, doc) {
        if (err) console.log(err);
        if (doc != null) {
          if (doc.object.definition.extensions['edu:uoc:la:semester']['code'] == '20081')
            console.log("j:" + j++);
        }
    });
};

module.exports = matricula;