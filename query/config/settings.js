var db = {
    dbName: 'lrs',
    dbHost: 'localhost',
    dbPort: 27017,
    prefix_consolidated: 'consolidated_'
};

var settings = {
    db_connection_url: 'mongodb://'+db.dbHost+':'+db.dbPort+'/'+db.dbName,
    source_collection: 'statements',
    destination_collection_aep: 'aep',
    destination_collection_grades: 'notes_per_semestres',
    destination_collection_grades_by_subject_and_semester: 'notes_per_assignatures_i_semestres',
    destination_collection_grades_by_study_and_semester: 'notes_per_estudis_i_semestres',
    destination_collection_enrolment: 'matricula_per_semestres',
    destination_collection_enrolment_by_user: 'matricula_per_usuaris',
    destination_collection_enrolment_by_user_and_semester: 'matricula_per_usuaris_i_semestres',
    destination_collection_enrolment_by_degree: 'matricula_per_titulacions',
    destination_collection_enrolment_by_degree_and_semester: 'matricula_per_titulacions_i_semestres',
    destination_collection_by_classroom_tool: 'accessos_eines',
    destination_collection_by_classroom_resource: 'accessos_recursos',
    destination_collection_by_classroom: 'accessos_aules',
    source_collection_people: 'people'
};


var collections = [];
Object.keys(settings).forEach(function(key) {
  var value = settings[key];
  if (key!='db_connection_url') {
    collections.push(value);
  }
});

var aws = {
    credentials: 'learning-analytics',
    region: 'eu-west-1',
    apiversion: 'latest',
    bucketName: 'YOUR_BUCKET_NAME',
    s3PathPrefixCsvFiles: 'csv/' //end with Slash "/"
};

exports.aws = aws;
exports.settings = settings;
exports.db = db;
exports.collections = collections;
