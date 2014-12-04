exports.settings = {
	db_connection_url: 'mongodb://localhost:27017/lrs',
	source_collection: 'statements',
	destination_collection_aep: 'aep',
	destination_collection_grades: 'notes_per_semestres',
	destination_collection_enrolment: 'matricula_per_semestres',
	destination_collection_enrolment_by_user: 'matricula_per_usuaris',
	destination_collection_enrolment_by_user_and_semester: 'matricula_per_usuaris_i_semestres'
}