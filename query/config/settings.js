var db = {
    dbName: 'lrs',
    dbHost: 'localhost',
    dbPort: 27017
};

var settings = {
    db_connection_url: 'mongodb://'+db.dbHost+':'+db.dbHost+'/'+db.dbPort,
    source_collection: 'statements',
    destination_collection_aep: 'aep',
    destination_collection_grades: 'notes_per_semestres',
    destination_collection_enrolment: 'matricula_per_semestres',
    destination_collection_enrolment_by_user: 'matricula_per_usuaris',
    destination_collection_enrolment_by_user_and_semester: 'matricula_per_usuaris_i_semestres'
};


var collections = [];
Object.keys(settings).forEach(function(key) {
  var value = settings[key];
  if (key!='db_connection_url') {
    collections.push(value);
  }
});
exports.settings = settings;
exports.db = db;
exports.collections = collections;