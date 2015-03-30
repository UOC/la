exports.settings = {
      db_connection_url: 'mongodb://localhost:27017/lrs',
      source_collection: 'statements',
      people_source_collection: 'people',
      collection_enrollment_by_user: 'statements',
      collection_enrollment_by_user_and_semester: 'matricula_per_usuaris_i_semestres',
      collection_enrollment_by_user_and_subject: 'matricula_per_usuaris_i_aules',
      aws_region: 'eu-west-1',
      dinamo_table_name: 'learningAnalytics',
      login: {
        removePreviousElements: false,
        // initialLine: {
        //   'temp/xbs': 168425
        // }
      },
      aepresposta: {

      },
      assmatr: {

      },
      matriculat: {

      },
      matricula: {
        initialBlock: 57625
      },
};
